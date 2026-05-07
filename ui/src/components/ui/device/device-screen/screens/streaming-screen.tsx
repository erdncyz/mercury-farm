import { useEffect, useRef } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'
import { Spinner } from '@vkontakte/vkui'
import { useInjection } from 'inversify-react'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { useScreenAutoQuality } from '@/lib/hooks/use-screen-auto-quality.hook'
import { useScreenStreaming } from '@/lib/hooks/use-screen-streaming.hook'
import { useCallbackWithErrorHandling } from '@/lib/hooks/use-callback-with-error-handling.hook'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import styles from '../device-screen.module.css'

import type { ChangeEvent, ClipboardEvent, KeyboardEvent, RefObject } from 'react'

interface ScreenProps {
  canvasWrapperRef: RefObject<HTMLDivElement>
}

export const StreamingScreen = observer(({ canvasWrapperRef }: ScreenProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const touchService = useInjection(CONTAINER_IDS.touchService)
  const keyboardService = useInjection(CONTAINER_IDS.keyboardService)
  const deviceScreenStore = useInjection(CONTAINER_IDS.deviceScreenStore)

  useScreenStreaming({ canvasRef, canvasWrapperRef })
  useScreenAutoQuality()

  const onMouseDown = useCallbackWithErrorHandling((event: MouseEvent) => {
    event.preventDefault()

    touchService.mouseDownListener({
      mousePageX: event.clientX,
      mousePageY: event.clientY,
      eventTimestamp: event.timeStamp,
      isAltKeyPressed: event.altKey,
      isRightButtonPressed: event.button === 2,
      focusInput: () => inputRef.current?.focus(),
    })
  })

  const onMouseMove = useCallbackWithErrorHandling((event: MouseEvent) => {
    event.preventDefault()

    touchService.mouseMoveListener({
      mousePageX: event.clientX,
      mousePageY: event.clientY,
      isRightButtonPressed: event.button === 2,
      isAltKeyPressed: event.altKey,
    })
  })

  const onMouseUp = useCallbackWithErrorHandling((event: MouseEvent) => {
    event.preventDefault()

    touchService.mouseUpListener({
      mousePageX: event.clientX,
      mousePageY: event.clientY,
      isRightButtonPressed: event.button === 2,
    })

    touchService.mouseUpBugWorkaroundListener(event)
  })

  const onWindowMouseUp = useCallbackWithErrorHandling((event: MouseEvent) => {
    touchService.mouseUpListener({
      mousePageX: event.clientX,
      mousePageY: event.clientY,
      isRightButtonPressed: event.button === 2,
    })

    touchService.mouseUpBugWorkaroundListener(event)
  })

  const onTouchEnd = useCallbackWithErrorHandling((event: TouchEvent) => {
    event.preventDefault()

    touchService.touchEndListener({
      touches: event.touches,
      changedTouches: event.changedTouches,
    })
  })

  const onTouchMove = useCallbackWithErrorHandling((event: TouchEvent) => {
    event.preventDefault()
    touchService.touchMoveListener({ changedTouches: event.changedTouches })
  })

  const onTouchStart = useCallbackWithErrorHandling((event: TouchEvent) => {
    event.preventDefault()

    touchService.touchStartListener({
      touches: event.touches,
      changedTouches: event.changedTouches,
    })
  })

  const onInputChange = useCallbackWithErrorHandling((event: ChangeEvent<HTMLInputElement>) => {
    keyboardService.changeListener({
      value: event.target.value,
      clearInput: () => {
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
    })
  })

  const onCopy = useCallbackWithErrorHandling((event: ClipboardEvent) => {
    event.preventDefault()

    keyboardService.copyListener({
      setClipboardData: (content) => event.clipboardData.setData('text/plain', content),
    })
  })

  const onKeyDown = useCallbackWithErrorHandling((event: KeyboardEvent<HTMLInputElement>) => {
    keyboardService.keyDownListener({
      key: event.key,
      preventDefault: event.preventDefault.bind(event),
    })
  })

  const onKeyUp = useCallbackWithErrorHandling((event: KeyboardEvent<HTMLInputElement>) => {
    keyboardService.keyUpListener({
      code: event.code,
      key: event.key,
      keyCode: event.keyCode,
      charCode: event.key.charCodeAt(0),
      preventDefault: event.preventDefault.bind(event),
    })
  })

  const onPaste = useCallbackWithErrorHandling((event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()

    keyboardService.pasteListener({
      getClipboardData: () => event.clipboardData.getData('text/plain'),
    })
  })

  useEffect(() => {
    const el = canvasWrapperRef?.current

    if (!el) return

    const touchListenerOptions: AddEventListenerOptions = { passive: false }
    const preventContextMenu = (event: Event) => event.preventDefault()

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseup', onMouseUp)
    el.addEventListener('touchend', onTouchEnd, touchListenerOptions)
    el.addEventListener('touchmove', onTouchMove, touchListenerOptions)
    el.addEventListener('touchstart', onTouchStart, touchListenerOptions)
    el.addEventListener('contextmenu', preventContextMenu)

    window.addEventListener('mouseup', onWindowMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('contextmenu', preventContextMenu)

      window.removeEventListener('mouseup', onWindowMouseUp)
    }
  }, [canvasWrapperRef, onMouseDown, onMouseMove, onMouseUp, onTouchEnd, onTouchMove, onTouchStart, onWindowMouseUp])

  return (
    <>
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          className={cn(styles.canvas, {
            [styles.letterbox]: deviceScreenStore.isAspectRatioModeLetterbox,
          })}
        />
        {touchService.slots.map((value, index) => (
          <span
            key={value}
            className={cn(styles.finger, { [styles.activeFinger]: touchService.fingers[index] })}
            style={
              touchService.fingers[index]
                ? {
                    transform: `translate3d(${touchService.fingers[index].x}px,${touchService.fingers[index].y}px,0) scale(${touchService.fingers[index].pressure + 0.5},${touchService.fingers[index].pressure + 0.5}`,
                  }
                : {}
            }
          />
        ))}
        <ConditionalRender conditions={[deviceScreenStore.isScreenLoading]}>
          <Spinner className={styles.spinner} size='xl' />
        </ConditionalRender>
      </div>
      <input
        ref={inputRef}
        autoCapitalize='off'
        autoComplete='off'
        autoCorrect='off'
        className={styles.screenInput}
        inputMode='text'
        type='text'
        onChange={onInputChange}
        onCopy={onCopy}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPaste={onPaste}
      />
    </>
  )
})
