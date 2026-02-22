import { useEffect } from 'react'

import type { RefObject } from 'react'

export const useAutoScroll = (ref: RefObject<HTMLElement>): void => {
  useEffect(() => {
    if (!ref.current) return undefined

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (ref.current && !entry.isIntersecting) {
          ref.current.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
        }
      },
      { threshold: 0.1 }
    )

    intersectionObserver.observe(ref.current)

    return (): void => {
      intersectionObserver.disconnect()
    }
  }, [])
}
