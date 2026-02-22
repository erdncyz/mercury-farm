import { useEffect } from 'react'
import { useInjection } from 'inversify-react'
import { useErrorBoundary } from 'react-error-boundary'

import { debounce } from '@/lib/utils/debounce.util'
import { CONTAINER_IDS } from '@/config/inversify/container-ids'

import type { RefObject } from 'react'

type UseScreenStreamingArgs = {
  canvasRef: RefObject<HTMLCanvasElement>
  canvasWrapperRef: RefObject<HTMLDivElement>
}

export const useScreenStreaming = ({ canvasRef, canvasWrapperRef }: UseScreenStreamingArgs): void => {
  const { showBoundary } = useErrorBoundary()

  const deviceScreenStore = useInjection(CONTAINER_IDS.deviceScreenStore)

  useEffect(() => {
    if (!canvasRef.current || !canvasWrapperRef.current) return undefined

    deviceScreenStore.startScreenStreaming(canvasRef.current, canvasWrapperRef.current).catch(showBoundary)

    return (): void => {
      deviceScreenStore.stopScreenStreaming()
    }
  }, [deviceScreenStore])

  useEffect(() => {
    if (!canvasWrapperRef.current || !deviceScreenStore) return undefined

    const debouncedUpdateBounds = debounce(deviceScreenStore.updateBounds, 1000)

    const resizeObserver = new ResizeObserver(() => {
      /* NOTE: This is not debounced because it needs to respond to all resize events immediately
        to detect when the device has a wider aspect ratio than the wrapper element (and vice versa)
        and to change the aspect ratio mode accordingly
      */
      deviceScreenStore.determineAspectRatioMode()

      debouncedUpdateBounds()
    })

    resizeObserver.observe(canvasWrapperRef.current)

    return (): void => {
      if (canvasWrapperRef.current) {
        resizeObserver.unobserve(canvasWrapperRef.current)
      }

      resizeObserver.disconnect()
    }
  }, [deviceScreenStore])
}
