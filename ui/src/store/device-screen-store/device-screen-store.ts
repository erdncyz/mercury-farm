import { t } from 'i18next'
import { makeAutoObservable, runInAction } from 'mobx'
import { inject, injectable } from 'inversify'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { DeviceBySerialStore } from '@/store/device-by-serial-store'
import { socket } from '@/api/socket'
import { deviceErrorModalStore } from '@/store/device-error-modal-store'
import { deviceConnectionRequired } from '@/config/inversify/decorators'
import { authStore } from '@/store/auth-store'

import type { ElementBoundSize, StartScreenStreamingMessage } from './types'
import type { Device } from '@/generated/types'

@injectable()
@deviceConnectionRequired()
export class DeviceScreenStore {
  private readonly websocketReconnectionInterval = 3000 // NOTE: 3s initial, with exponential backoff
  private readonly websocketReconnectionMaxAttempts = 6 // NOTE: 3s + 6s + 12s + 24s + 48s + 96s ~ 3min total
  private websocket: WebSocket | null = null
  private websocketReconnecting = false
  private websocketReconnectionAttempt = 0
  private websocketReconnectionTimeoutID: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  private context: ImageBitmapRenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null
  private canvasWrapper: HTMLDivElement | null = null
  private device: Device | null = null
  private showScreen = true
  private options = {
    autoScaleForRetina: true,
    density: Math.max(1, Math.min(1.5, devicePixelRatio || 1)),
    minScale: 0.36,
  }
  private adjustedBoundSize = {
    width: 0,
    height: 0,
  }
  private screenRotation = 0
  private isDecodingFrame = false
  private pendingFrameBlob: Blob | null = null
  private isScreenStreamingJustStarted = false
  private lastFrameWidth = 0
  private lastFrameHeight = 0
  private rotationCanvas: OffscreenCanvas | null = null
  private rotationCtx: OffscreenCanvasRenderingContext2D | null = null

  isAspectRatioModeLetterbox = false
  isScreenLoading = false
  isScreenRotated = false

  constructor(@inject(CONTAINER_IDS.deviceBySerialStore) private deviceBySerialStore: DeviceBySerialStore) {
    this.updateBounds = this.updateBounds.bind(this)
    this.messageListener = this.messageListener.bind(this)
    this.openListener = this.openListener.bind(this)
    this.onDeviceRotationChange = this.onDeviceRotationChange.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.handleWindowFocus = this.handleWindowFocus.bind(this)
    this.handlePageShow = this.handlePageShow.bind(this)
    this.handlePageHide = this.handlePageHide.bind(this)

    makeAutoObservable(this)
  }

  get getDevice(): Device | null {
    return this.device
  }

  get getCanvasWrapper(): HTMLDivElement | null {
    return this.canvasWrapper
  }

  get getScreenRotation(): number {
    return this.screenRotation
  }

  setIsScreenLoading(value: boolean): void {
    this.isScreenLoading = value
  }

  async init(): Promise<void> {
    this.device = await this.deviceBySerialStore.fetchFresh()
  }

  async startScreenStreaming(canvas: HTMLCanvasElement, canvasWrapper: HTMLDivElement): Promise<void> {
    runInAction(() => {
      this.setIsScreenLoading(true)
    })

    // NOTE: Prevents ws connection if stopScreenStreaming was called earlier
    if (this.disposed) {
      this.disposed = false

      return
    }

    this.context = canvas.getContext('bitmaprenderer')
    this.canvas = canvas
    this.canvasWrapper = canvasWrapper

    socket.on('device.change', this.onDeviceRotationChange)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener('focus', this.handleWindowFocus)
    window.addEventListener('pageshow', this.handlePageShow)
    window.addEventListener('pagehide', this.handlePageHide)

    this.connectWebsocket()
  }

  async reconnectScreenStreaming(): Promise<void> {
    if (!this.canvas || !this.canvasWrapper) return

    if (this.websocketReconnectionTimeoutID) {
      clearTimeout(this.websocketReconnectionTimeoutID)
      this.websocketReconnectionTimeoutID = null
    }

    this.websocketReconnecting = false
    this.websocketReconnectionAttempt = 0
    this.isScreenStreamingJustStarted = true
    this.setIsScreenLoading(true)

    await this.init()

    this.stopWebsocket()
    this.connectWebsocket()
  }

  stopScreenStreaming(): void {
    this.disposed = true
    this.stopWebsocket()

    socket.off('device.change', this.onDeviceRotationChange)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleWindowFocus)
    window.removeEventListener('pageshow', this.handlePageShow)
    window.removeEventListener('pagehide', this.handlePageHide)

    if (this.websocketReconnectionTimeoutID) {
      clearTimeout(this.websocketReconnectionTimeoutID)
      this.websocketReconnectionTimeoutID = null
    }
  }

  updateBounds(): void {
    if (!this.canvasWrapper) {
      throw new Error('Unable to read bounds; container must have dimensions')
    }

    const newAdjustedBoundSize = this.getNewAdjustedBoundSize(
      this.canvasWrapper.offsetWidth,
      this.canvasWrapper.offsetHeight
    )

    if (!newAdjustedBoundSize) {
      return
    }

    if (
      !this.adjustedBoundSize ||
      newAdjustedBoundSize.width !== this.adjustedBoundSize.width ||
      newAdjustedBoundSize.height !== this.adjustedBoundSize.height
    ) {
      this.adjustedBoundSize = newAdjustedBoundSize
      this.onScreenInterestAreaChanged()
    }
  }

  determineAspectRatioMode(): void {
    if (this.canvasWrapper && this.context) {
      const canvasAspect = this.context.canvas.width / this.context.canvas.height
      const canvasWrapperAspect = this.canvasWrapper.offsetWidth / this.canvasWrapper.offsetHeight

      this.isAspectRatioModeLetterbox = canvasWrapperAspect < canvasAspect

      // Re-apply explicit canvas sizing when container is resized
      if (this.isAspectRatioModeLetterbox && this.canvas && this.lastFrameWidth > 0) {
        const containerWidth = this.canvasWrapper.offsetWidth
        const containerHeight = this.canvasWrapper.offsetHeight
        const frameAspect = this.lastFrameWidth / this.lastFrameHeight
        const cssWidth = containerWidth
        const cssHeight = Math.round(containerWidth / frameAspect)

        this.canvas.style.width = `${cssWidth}px`
        this.canvas.style.height = `${cssHeight}px`
        this.canvas.style.position = 'absolute'
        this.canvas.style.left = '0'
        this.canvas.style.top = `${Math.round((containerHeight - cssHeight) / 2)}px`
        this.canvas.style.right = 'auto'
        this.canvas.style.bottom = 'auto'
      }
    }
  }

  private shouldUpdateScreen(): boolean {
    return Boolean(
      // NO if the user has disabled the screen.
      this.showScreen &&
        // NO if the page is not visible (e.g. background tab).
        document.visibilityState === 'visible' &&
        // NO if we don't have a connection yet.
        this.websocket &&
        this.websocket.readyState === WebSocket.OPEN
      // YES otherwise
    )
  }

  private onScreenInterestGained(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send('on')
    }
  }

  private onScreenInterestAreaChanged(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send('size ' + this.adjustedBoundSize.width + 'x' + this.adjustedBoundSize.height)
    }
  }

  private onScreenInterestLost(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send('off')
    }
  }

  private refreshScreenInterest(): void {
    if (this.disposed) {
      return
    }

    if (!this.shouldUpdateScreen()) {
      this.onScreenInterestLost()

      return
    }

    this.updateBounds()
    this.onScreenInterestGained()
  }

  private decodeAndRenderFrame(blob: Blob): void {
    createImageBitmap(blob)
      .then((image) => {
        runInAction(() => {
          if (!this.context) {
            // NOTE: Release the decoded bitmap; otherwise GPU/native memory leaks per frame
            image.close()
            this.isDecodingFrame = false
            this.pendingFrameBlob = null

            return
          }

          const willRotate = this.needsFrameRotation(image.width, image.height)

          const frameToRender = willRotate ? this.rotateFrame(image) : image

          // NOTE: When rotating, rotateFrame() produces a new bitmap, so the source
          // bitmap is no longer needed and must be closed to avoid a per-frame leak.
          // In the non-rotate path, transferFromImageBitmap() below consumes the bitmap.
          if (willRotate) {
            image.close()
          }

          const dimensionsChanged =
            frameToRender.width !== this.lastFrameWidth || frameToRender.height !== this.lastFrameHeight

          if (this.isScreenStreamingJustStarted || dimensionsChanged) {
            this.lastFrameWidth = frameToRender.width
            this.lastFrameHeight = frameToRender.height
            this.updateImageArea(frameToRender.width, frameToRender.height)

            if (this.isScreenStreamingJustStarted) {
              this.setIsScreenLoading(false)
              this.isScreenStreamingJustStarted = false
            }
          }

          this.context.transferFromImageBitmap(frameToRender)

          if (this.pendingFrameBlob) {
            const nextBlob = this.pendingFrameBlob
            this.pendingFrameBlob = null
            this.decodeAndRenderFrame(nextBlob)
          } else {
            this.isDecodingFrame = false
          }
        })
      })
      .catch(() => {
        this.isDecodingFrame = false
        this.pendingFrameBlob = null
      })
  }

  private recoverScreenStreaming(): void {
    if (this.disposed || document.visibilityState !== 'visible') {
      return
    }

    const socketState = this.websocket?.readyState

    if (socketState === WebSocket.OPEN) {
      this.refreshScreenInterest()

      return
    }

    if (socketState === WebSocket.CONNECTING || this.websocketReconnecting || this.websocketReconnectionTimeoutID) {
      return
    }

    this.setIsScreenLoading(true)
    this.stopWebsocket()
    this.reconnectWebsocket()
  }

  private adjustBoundedSize(width: number, height: number): ElementBoundSize | null {
    if (!this.device?.display?.width || !this.device?.display?.height) {
      return null
    }

    const scaledWidth = this.device.display.width * this.options.minScale
    const scaledHeight = this.device.display.height * this.options.minScale

    let sw = width * this.options.density
    let sh = height * this.options.density

    if (sw < scaledWidth) {
      sw *= scaledWidth / sw
      sh *= scaledWidth / sh
    }

    if (sh < scaledHeight) {
      sw *= scaledHeight / sw
      sh *= scaledHeight / sh
    }

    return {
      width: Math.ceil(sw),
      height: Math.ceil(sh),
    }
  }

  private getNewAdjustedBoundSize(width: number, height: number): ElementBoundSize | null {
    switch (this.screenRotation) {
      case 90:
      case 270:
        return this.adjustBoundedSize(height, width)
      case 0:
      case 180:

      /* falls through */
      default:
        return this.adjustBoundedSize(width, height)
    }
  }

  private get isIosDevice(): boolean {
    const platform = (this.device?.platform || '').toLowerCase()
    const manufacturer = (this.device?.manufacturer || '').toLowerCase()

    return platform === 'ios' || manufacturer === 'apple'
  }

  private isRotated(): boolean {
    return this.screenRotation === 90 || this.screenRotation === 270
  }

  private needsFrameRotation(imageWidth: number, imageHeight: number): boolean {
    if (!this.isIosDevice) return false

    const isOrientationLandscape = this.screenRotation === 90 || this.screenRotation === 270
    const isFramePortrait = imageHeight > imageWidth

    return isOrientationLandscape && isFramePortrait
  }

  private rotateFrame(image: ImageBitmap): ImageBitmap {
    const width = image.height
    const height = image.width

    if (!this.rotationCanvas || this.rotationCanvas.width !== width || this.rotationCanvas.height !== height) {
      this.rotationCanvas = new OffscreenCanvas(width, height)
      this.rotationCtx = this.rotationCanvas.getContext('2d')
    }

    const ctx = this.rotationCtx!

    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.rotate(this.screenRotation === 90 ? -Math.PI / 2 : Math.PI / 2)
    ctx.drawImage(image, -image.width / 2, -image.height / 2)
    ctx.restore()

    return this.rotationCanvas.transferToImageBitmap()
  }

  private updateImageArea(imageWidth: number, imageHeight: number): void {
    if (!this.context) {
      throw new Error('Context is not set')
    }

    if (this.options.autoScaleForRetina) {
      this.context.canvas.width = imageWidth * (devicePixelRatio || 1)
      this.context.canvas.height = imageHeight * (devicePixelRatio || 1)
    }

    if (!this.options.autoScaleForRetina) {
      this.context.canvas.width = imageWidth
      this.context.canvas.height = imageHeight
    }

    this.isScreenRotated = this.isRotated()
    this.determineAspectRatioMode()

    // Explicitly set canvas CSS dimensions when in letterbox mode
    // to ensure proper sizing regardless of CSS auto behavior
    if (this.canvasWrapper && this.canvas && this.isAspectRatioModeLetterbox) {
      const containerWidth = this.canvasWrapper.offsetWidth
      const containerHeight = this.canvasWrapper.offsetHeight
      const frameAspect = imageWidth / imageHeight
      const cssWidth = containerWidth
      const cssHeight = Math.round(containerWidth / frameAspect)

      this.canvas.style.width = `${cssWidth}px`
      this.canvas.style.height = `${cssHeight}px`
      this.canvas.style.position = 'absolute'
      this.canvas.style.left = '0'
      this.canvas.style.top = `${Math.round((containerHeight - cssHeight) / 2)}px`
      this.canvas.style.right = 'auto'
      this.canvas.style.bottom = 'auto'
    } else if (this.canvas && this.canvas.style.top !== '') {
      // Reset to CSS class defaults when not in letterbox
      this.canvas.style.width = ''
      this.canvas.style.height = ''
      this.canvas.style.top = ''
      this.canvas.style.left = ''
      this.canvas.style.right = ''
      this.canvas.style.bottom = ''
    }
  }

  private connectWebsocket(): void {
    if (!this.device?.display?.url) {
      throw new Error('No display url')
    }

    if (!authStore.jwt) {
      console.warn('No JWT token available in authStore')
      throw new Error('Authentication token required')
    }

    // Pass JWT token securely via WebSocket subprotocol
    this.websocket = new WebSocket(this.device.display.url, `access_token.${authStore.jwt}`)

    this.websocket.binaryType = 'blob'
    this.websocket.onopen = this.openListener.bind(this)
    this.websocket.onmessage = this.messageListener.bind(this)
    this.websocket.onerror = this.errorListener.bind(this)
    this.websocket.onclose = this.closeListener.bind(this)
  }

  private stopWebsocket(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  private reconnectWebsocket(): void {
    // NOTE: No need reconnect if it is already in progress
    if (this.websocketReconnecting || this.websocketReconnectionTimeoutID) return

    this.websocketReconnecting = true
    this.websocketReconnectionAttempt += 1
    this.connectWebsocket()
  }

  private openListener(): void {
    if (this.websocketReconnecting) {
      this.websocketReconnecting = false
      this.websocketReconnectionAttempt = 0
    }

    this.isScreenStreamingJustStarted = true
  }

  private onDeviceRotationChange({ data }: { data: Partial<Device> & { serial: string } }): void {
    if (data.serial !== this.device?.serial) return

    if (data.display?.rotation !== undefined && data.display.rotation !== this.screenRotation) {
      this.screenRotation = data.display.rotation
      this.isScreenRotated = this.isRotated()
      this.updateBounds()
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.recoverScreenStreaming()

      return
    }

    this.onScreenInterestLost()
  }

  private handleWindowFocus(): void {
    this.recoverScreenStreaming()
  }

  private handlePageShow(): void {
    this.recoverScreenStreaming()
  }

  private handlePageHide(): void {
    this.onScreenInterestLost()
  }

  private messageListener(message: MessageEvent<Blob | string>): void {
    if (message.data instanceof Blob) {
      if (this.isDecodingFrame) {
        this.pendingFrameBlob = message.data

        return
      }

      this.isDecodingFrame = true
      this.decodeAndRenderFrame(message.data)

      return
    }

    if (message.data === 'secure_on') {
      // NOTE: The current view is marked secure and cannot be viewed remotely

      return
    }

    // Handle authentication messages
    if (typeof message.data === 'string') {
      try {
        const authMessage = JSON.parse(message.data)

        if (authMessage.type === 'auth_success') {
          console.info('WebSocket authentication successful')

          if (this.shouldUpdateScreen()) {
            this.updateBounds()
            this.onScreenInterestGained()

            return
          }

          this.onScreenInterestLost()

          return
        }

        if (authMessage.type === 'auth_error') {
          console.error('WebSocket authentication failed:', authMessage.message)

          return
        }

        if (authMessage.type === 'orientation') {
          const rotation = authMessage.rotation

          if (typeof rotation === 'number' && rotation !== this.screenRotation) {
            this.screenRotation = rotation
            this.isScreenRotated = this.isRotated()
            this.isScreenStreamingJustStarted = true
            this.updateBounds()
          }

          return
        }
      } catch {
        /* empty */
      }
    }

    const startRegex = /^start /

    if (startRegex.test(message.data)) {
      const startData: StartScreenStreamingMessage = JSON.parse(message.data.replace(startRegex, ''))

      this.isScreenStreamingJustStarted = true

      this.screenRotation = startData.orientation
    }
  }

  private errorListener(): void {}

  private closeListener(event: CloseEvent): void {
    this.setIsScreenLoading(true)
    this.websocketReconnecting = false

    if (event.code === 1008) {
      deviceErrorModalStore.setError(t('Unauthorized'))

      return
    }

    if (!event.wasClean && this.websocketReconnectionAttempt < this.websocketReconnectionMaxAttempts) {
      const backoffDelay = this.websocketReconnectionInterval * Math.pow(2, this.websocketReconnectionAttempt)

      this.websocketReconnectionTimeoutID = setTimeout(() => {
        this.websocketReconnectionTimeoutID = null
        this.reconnectWebsocket()
      }, backoffDelay)

      return
    }

    if (this.websocketReconnectionAttempt >= this.websocketReconnectionMaxAttempts) {
      deviceErrorModalStore.setError(t('Service is currently unavailable'))
    }
  }
}
