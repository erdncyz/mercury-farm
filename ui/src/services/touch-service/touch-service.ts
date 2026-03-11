import { autorun, makeAutoObservable } from 'mobx'
import { inject, injectable } from 'inversify'

import { ScalingService } from '@/services/scaling-service/scaling-service'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceControlStore } from '@/store/device-control-store'
import { DeviceBySerialStore } from '@/store/device-by-serial-store'
import { DeviceScreenStore } from '@/store/device-screen-store/device-screen-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'

import type {
  Finger,
  GetScaledCoordsArgs,
  GetScaledCoordsReturn,
  MouseDownListenerArgs,
  MouseMoveListener,
  MouseUpListener,
  SetFingerArgs,
  TouchMoveListenerArgs,
  TouchStartEndListenerArgs,
} from './types'

@injectable()
@deviceConnectionRequired()
export class TouchService {
  private readonly cycle = 100
  private readonly minMoveDelta = 0.003
  private readonly minIosSwipeDelta = 0.004
  private readonly iosSwipeMinDuration = 0.12
  private readonly iosSwipeMaxDuration = 0.8
  private prevCoords: { x: number; y: number } = { x: 0, y: 0 }
  private iosSwipeStartCoords: { x: number; y: number } | null = null
  private iosSwipeStartAt = 0
  private slotted: Record<string, number> = {}
  private seq = -1
  private fakePinch = false
  private lastPossiblyBuggyMouseUpEvent: MouseEvent | null = null
  private isMouseDown = false
  private isTouching = false

  /* NOTE: The reverse order is important because slots and fingers are in
    opposite sort order. Anyway don't change anything here unless
    you understand what it does and why.
  */
  slots = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  fingers: Record<number, Finger> = {}

  constructor(
    @inject(CONTAINER_IDS.scalingService) private scalingService: ScalingService,
    @inject(CONTAINER_IDS.deviceScreenStore) private deviceScreenStore: DeviceScreenStore,
    @inject(CONTAINER_IDS.deviceControlStore) private deviceControlStore: DeviceControlStore,
    @inject(CONTAINER_IDS.deviceBySerialStore) private deviceBySerialStore: DeviceBySerialStore
  ) {
    makeAutoObservable(this)
    autorun(() => {
      const { data: device } = this.deviceBySerialStore.deviceQueryResult()

      if (!device?.capabilities?.hasCursor) {
        this.removeAllFingers()
      }
    })
  }

  private isIosDevice(device?: { manufacturer?: string; platform?: string; ios?: boolean } | null): boolean {
    if (!device) {
      return false
    }

    const manufacturer = (device.manufacturer || '').toLowerCase()
    const platform = (device.platform || '').toLowerCase()

    return device.ios === true || platform === 'ios' || platform === 'tvos' || manufacturer === 'apple'
  }

  mouseUpBugWorkaroundListener(event: MouseEvent): void {
    this.lastPossiblyBuggyMouseUpEvent = event
  }

  mouseDownListener({
    mousePageX,
    mousePageY,
    eventTimestamp,
    isAltKeyPressed,
    isRightButtonPressed,
    focusInput,
  }: MouseDownListenerArgs): void {
    this.isMouseDown = true

    // NOTE: Skip right button click
    if (isRightButtonPressed) return

    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (!device?.display?.width || !device.display?.height || !this.deviceScreenStore.getCanvasWrapper) return

    this.fakePinch = isAltKeyPressed

    const screenBoundingRect = this.getScreenBoundingRect()
    const wrapperBoundingRect = this.getWrapperBoundingRect()

    this.startMousing(focusInput)

    const scaled = this.getScaledCoords({
      displayWidth: device.display.width,
      displayHeight: device.display.height,
      isIosDevice: this.isIosDevice(device),
      mousePageX,
      mousePageY,
      screenBoundingRect,
    })

    this.prevCoords = {
      x: scaled.coords.xP,
      y: scaled.coords.yP,
    }
    this.iosSwipeStartCoords = {
      x: scaled.coords.xP,
      y: scaled.coords.yP,
    }
    this.iosSwipeStartAt = Date.now()

    const pressure = 0.5

    this.deviceControlStore.touchDown({
      seq: this.nextSeq(),
      contact: 0,
      x: scaled.coords.xP,
      y: scaled.coords.yP,
      pressure,
    })

    if (this.fakePinch) {
      this.deviceControlStore.touchDown({
        seq: this.nextSeq(),
        contact: 1,
        x: 1 - scaled.coords.xP,
        y: 1 - scaled.coords.yP,
        pressure,
      })
    }

    this.deviceControlStore.touchCommit(this.nextSeq())

    this.setFinger({
      index: 0,
      x: mousePageX - wrapperBoundingRect.left,
      y: mousePageY - wrapperBoundingRect.top,
      pressure,
    })

    if (this.fakePinch) {
      this.setFinger({
        index: 1,
        x: -mousePageX + wrapperBoundingRect.left + wrapperBoundingRect.width,
        y: -mousePageY + wrapperBoundingRect.top + wrapperBoundingRect.height,
        pressure,
      })
    }

    if (this.lastPossiblyBuggyMouseUpEvent && this.lastPossiblyBuggyMouseUpEvent.timeStamp > eventTimestamp) {
      // NOTE: We got mouseup before mousedown. See mouseUpBugWorkaroundListener for details.
      this.mouseUpListener({
        mousePageX: this.lastPossiblyBuggyMouseUpEvent.clientX,
        mousePageY: this.lastPossiblyBuggyMouseUpEvent.clientY,
        isRightButtonPressed: this.lastPossiblyBuggyMouseUpEvent.button === 2,
      })

      return
    }

    this.lastPossiblyBuggyMouseUpEvent = null
  }

  mouseUpListener({ isRightButtonPressed, mousePageX, mousePageY }: MouseUpListener): void {
    if (!this.isMouseDown) return

    this.isMouseDown = false

    // NOTE: Skip right button click
    if (isRightButtonPressed) return

    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (!device?.display?.width || !device.display?.height || !this.deviceScreenStore.getCanvasWrapper) return

    const screenBoundingRect = this.getScreenBoundingRect()
    const scaled = this.getScaledCoords({
      displayWidth: device.display.width,
      displayHeight: device.display.height,
      isIosDevice: this.isIosDevice(device),
      mousePageX,
      mousePageY,
      screenBoundingRect,
    })

    const pressure = 0.5

    const from = this.iosSwipeStartCoords || this.prevCoords
    const iosSwipeDistanceX = Math.abs(from.x - scaled.coords.xP)
    const iosSwipeDistanceY = Math.abs(from.y - scaled.coords.yP)

    if (
      (iosSwipeDistanceX >= this.minIosSwipeDelta || iosSwipeDistanceY >= this.minIosSwipeDelta) &&
      this.isIosDevice(device)
    ) {
      const elapsedSeconds = (Date.now() - this.iosSwipeStartAt) / 1000
      const duration = Math.min(this.iosSwipeMaxDuration, Math.max(this.iosSwipeMinDuration, elapsedSeconds))

      this.deviceControlStore.touchMoveIos({
        x: scaled.coords.xP,
        y: scaled.coords.yP,
        pX: from.x,
        pY: from.y,
        pressure,
        duration,
        seq: this.nextSeq(),
        contact: 0,
      })
      this.deviceControlStore.touchCommit(this.nextSeq())
    }

    this.deviceControlStore.touchUp(this.nextSeq(), 0)

    if (this.fakePinch) {
      this.deviceControlStore.touchUp(this.nextSeq(), 1)
    }

    this.deviceControlStore.touchCommit(this.nextSeq())

    this.removeFinger(0)

    if (this.fakePinch) {
      this.removeFinger(1)
    }

    this.stopMousing()
    this.iosSwipeStartCoords = null
    this.iosSwipeStartAt = 0
  }

  mouseMoveListener({
    isRightButtonPressed,
    mousePageX,
    mousePageY,
    isAltKeyPressed,
  }: MouseMoveListener): void {
    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (!this.isMouseDown && !device?.capabilities?.hasCursor) return

    // NOTE: Skip right button click
    if (isRightButtonPressed) return

    if (!device?.display?.width || !device.display?.height || !this.deviceScreenStore.getCanvasWrapper) return

    const screenBoundingRect = this.getScreenBoundingRect()
    const wrapperBoundingRect = this.getWrapperBoundingRect()

    const scaled = this.getScaledCoords({
      displayWidth: device.display.width,
      displayHeight: device.display.height,
      isIosDevice: this.isIosDevice(device),
      mousePageX,
      mousePageY,
      screenBoundingRect,
    })

    const addGhostFinger = !this.fakePinch && isAltKeyPressed
    const deleteGhostFinger = this.fakePinch && !isAltKeyPressed

    this.fakePinch = isAltKeyPressed

    const pressure = 0.5
    const hasMeaningfulMove =
      Math.abs(this.prevCoords.x - scaled.coords.xP) >= this.minMoveDelta ||
      Math.abs(this.prevCoords.y - scaled.coords.yP) >= this.minMoveDelta

    if (!hasMeaningfulMove) return

    const hasCursor = !!device.capabilities?.hasCursor
    let hasInputChanges = false

    if (this.isIosDevice(device) && !hasCursor) {
      // iOS swipe/scroll is sent as one W3C action chain on pointer-up.
      // Here we only track coordinates for final gesture calculation.
      this.prevCoords = {
        x: scaled.coords.xP,
        y: scaled.coords.yP,
      }
    } else {
      this.deviceControlStore.touchMove({
        seq: this.nextSeq(),
        contact: 0,
        x: scaled.coords.xP,
        y: scaled.coords.yP,
        pressure,
      })
      hasInputChanges = true
    }

    if (addGhostFinger && this.isIosDevice(device)) {
      // TODO: implement touchDownIos
      // this.deviceControlStore.touchDownIos(this.nextSeq(), 1, 1 - scaled.coords.xP, 1 - scaled.coords.yP, pressure)
    }

    if (addGhostFinger && device.manufacturer !== 'Apple') {
      this.deviceControlStore.touchDown({
        seq: this.nextSeq(),
        contact: 1,
        x: 1 - scaled.coords.xP,
        y: 1 - scaled.coords.yP,
        pressure,
      })
      hasInputChanges = true
    }

    if (!addGhostFinger && deleteGhostFinger) {
      this.deviceControlStore.touchUp(this.nextSeq(), 1)
      hasInputChanges = true
    }

    if (!addGhostFinger && !deleteGhostFinger && this.fakePinch) {
      this.deviceControlStore.touchMove({
        seq: this.nextSeq(),
        contact: 1,
        x: 1 - scaled.coords.xP,
        y: 1 - scaled.coords.yP,
        pressure,
      })
      hasInputChanges = true
    }

    if (hasInputChanges) {
      this.deviceControlStore.touchCommit(this.nextSeq())
      this.prevCoords = {
        x: scaled.coords.xP,
        y: scaled.coords.yP,
      }
    }

    this.setFinger({
      index: 0,
      x: mousePageX - wrapperBoundingRect.left,
      y: mousePageY - wrapperBoundingRect.top,
      pressure,
    })

    if (deleteGhostFinger) {
      this.removeFinger(1)
    }

    if (!deleteGhostFinger && this.fakePinch) {
      this.setFinger({
        index: 1,
        x: -mousePageX + wrapperBoundingRect.left + wrapperBoundingRect.width,
        y: -mousePageY + wrapperBoundingRect.top + wrapperBoundingRect.height,
        pressure,
      })
    }
  }

  touchStartListener({ touches, changedTouches }: TouchStartEndListenerArgs): void {
    this.isTouching = true

    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (!device?.display?.width || !device.display?.height || !this.deviceScreenStore.getCanvasWrapper) return

    const screenBoundingRect = this.getScreenBoundingRect()
    const wrapperBoundingRect = this.getWrapperBoundingRect()

    if (touches.length === changedTouches.length) {
      this.startTouching()
    }

    const currentTouches: Record<string, number> = {}

    for (let i = 0, l = touches.length; i < l; ++i) {
      currentTouches[touches[i].identifier] = 1
    }

    const maybeLostTouchEnd = (id: string): boolean => !(id in currentTouches)

    /* NOTE: We might have lost a touchend event due to various edge cases
      (literally) such as dragging from the bottom of the screen so that
      the control center appears. If so, let's ask for a reset.
    */
    const slottedKeys = Object.keys(this.slotted)

    if (slottedKeys.some(maybeLostTouchEnd)) {
      slottedKeys.forEach((id) => {
        this.slots.push(this.slotted[id])

        delete this.slotted[id]
      })

      this.slots.sort().reverse()

      this.deviceControlStore.touchReset(this.nextSeq())

      this.removeAllFingers()
    }

    if (!this.slots.length) {
      // NOTE: This should never happen but who knows...
      throw new Error('Ran out of multitouch slots')
    }

    for (let i = 0, l = changedTouches.length; i < l; ++i) {
      const touch = changedTouches[i]
      const slot = this.slots.pop()

      if (!slot) return

      const scaled = this.getScaledCoords({
        displayWidth: device.display.width,
        displayHeight: device.display.height,
        isIosDevice: this.isIosDevice(device),
        mousePageX: touch.clientX,
        mousePageY: touch.clientY,
        screenBoundingRect,
      })

      this.slotted[touch.identifier] = slot

      const pressure = touch.force || 0.5

      this.deviceControlStore.touchDown({
        seq: this.nextSeq(),
        contact: slot,
        x: scaled.coords.xP,
        y: scaled.coords.yP,
        pressure,
      })

      this.setFinger({
        index: slot,
        x: touch.clientX - wrapperBoundingRect.left,
        y: touch.clientY - wrapperBoundingRect.top,
        pressure,
      })
    }

    this.deviceControlStore.touchCommit(this.nextSeq())
  }

  touchMoveListener({ changedTouches }: TouchMoveListenerArgs): void {
    if (!this.isTouching) return

    const { data: device } = this.deviceBySerialStore.deviceQueryResult()

    if (!device?.display?.width || !device.display?.height || !this.deviceScreenStore.getCanvasWrapper) return

    const screenBoundingRect = this.getScreenBoundingRect()
    const wrapperBoundingRect = this.getWrapperBoundingRect()

    for (let i = 0, l = changedTouches.length; i < l; ++i) {
      const touch = changedTouches[i]
      const slot = this.slotted[touch.identifier]

      const scaled = this.getScaledCoords({
        displayWidth: device.display.width,
        displayHeight: device.display.height,
        isIosDevice: this.isIosDevice(device),
        mousePageX: touch.clientX,
        mousePageY: touch.clientY,
        screenBoundingRect,
      })

      const pressure = touch.force || 0.5

      if (this.isIosDevice(device)) {
      this.deviceControlStore.touchMoveIos({
        x: scaled.coords.xP,
        y: scaled.coords.yP,
        pX: this.prevCoords.x,
        pY: this.prevCoords.y,
        pressure,
        duration: this.iosSwipeMinDuration,
        seq: this.nextSeq(),
        contact: slot,
      })
      }

      this.deviceControlStore.touchMove({
        seq: this.nextSeq(),
        contact: slot,
        x: scaled.coords.xP,
        y: scaled.coords.yP,
        pressure,
      })

      this.prevCoords = {
        x: scaled.coords.xP,
        y: scaled.coords.yP,
      }

      this.setFinger({
        index: slot,
        x: touch.clientX - wrapperBoundingRect.left,
        y: touch.clientY - wrapperBoundingRect.top,
        pressure,
      })
    }

    this.deviceControlStore.touchCommit(this.nextSeq())
  }

  touchEndListener({ touches, changedTouches }: TouchStartEndListenerArgs): void {
    if (!this.isTouching) return

    this.isTouching = false

    let foundAny = false

    for (let i = 0, l = changedTouches.length; i < l; ++i) {
      const touch = changedTouches[i]
      const slot = this.slotted[touch.identifier]

      if (typeof slot === 'undefined') {
        /* NOTE: We've already disposed of the contact. We may have gotten a
          touchend event for the same contact twice.
        */
        continue
      }

      delete this.slotted[touch.identifier]

      this.slots.push(slot)

      this.deviceControlStore.touchUp(this.nextSeq(), slot)

      this.removeFinger(slot)

      foundAny = true
    }

    if (foundAny) {
      this.deviceControlStore.touchCommit(this.nextSeq())

      if (!touches.length) {
        this.stopTouching()
      }
    }
  }

  private nextSeq(): number {
    return ++this.seq >= this.cycle ? (this.seq = 0) : this.seq
  }

  private setFinger({ index, x, y, pressure }: SetFingerArgs): void {
    this.fingers[index] = {
      index,
      x,
      y,
      pressure,
    }
  }

  private removeFinger(index: number): void {
    delete this.fingers[index]
  }

  private removeAllFingers(): void {
    this.fingers = {}
  }

  private startMousing(focusInput: () => void): void {
    this.deviceControlStore.gestureStart(this.nextSeq())

    focusInput()
  }

  private stopMousing(): void {
    this.removeAllFingers()

    this.deviceControlStore.gestureStop(this.nextSeq())
  }

  private getScaledCoords({
    displayWidth,
    displayHeight,
    isIosDevice,
    mousePageX,
    mousePageY,
    screenBoundingRect,
  }: GetScaledCoordsArgs): GetScaledCoordsReturn {
    const x = mousePageX - screenBoundingRect.left
    const y = mousePageY - screenBoundingRect.top

    const rotation = this.deviceScreenStore.getScreenRotation
    const isLandscape = rotation === 90 || rotation === 270
    const effectiveWidth = isIosDevice && isLandscape ? displayHeight : displayWidth
    const effectiveHeight = isIosDevice && isLandscape ? displayWidth : displayHeight

    const scaler = this.scalingService.coordinator(effectiveWidth, effectiveHeight)
    const scaled = scaler.coords({
      boundingWidth: screenBoundingRect.width,
      boundingHeight: screenBoundingRect.height,
      relX: x,
      relY: y,
      rotation,
      isIosDevice: !!isIosDevice,
    })

    return {
      x,
      y,
      coords: scaled,
    }
  }

  private getScreenBoundingRect(): DOMRect {
    const wrapper = this.deviceScreenStore.getCanvasWrapper

    if (!wrapper) {
      throw new Error('Canvas wrapper is not ready')
    }

    const { data: device } = this.deviceBySerialStore.deviceQueryResult()
    const isIosDevice = this.isIosDevice(device)

    if (!isIosDevice) {
      return wrapper.getBoundingClientRect()
    }

    const canvasRect = wrapper.querySelector('canvas')?.getBoundingClientRect()

    if (canvasRect && canvasRect.width > 0 && canvasRect.height > 0) {
      return canvasRect
    }

    return wrapper.getBoundingClientRect()
  }

  private getWrapperBoundingRect(): DOMRect {
    const wrapper = this.deviceScreenStore.getCanvasWrapper

    if (!wrapper) {
      throw new Error('Canvas wrapper is not ready')
    }

    return wrapper.getBoundingClientRect()
  }

  private startTouching(): void {
    this.deviceControlStore.gestureStart(this.nextSeq())
  }

  private stopTouching(): void {
    this.removeAllFingers()

    this.deviceControlStore.gestureStop(this.nextSeq())
  }
}
