export const throttle = <T extends (...args: any[]) => void>(fn: T, wait: number) => {
  let lastTime: number
  let inThrottle: boolean
  let lastFn: ReturnType<typeof setTimeout>

  return function func(this: any, ...args: any[]): void {
    if (inThrottle) {
      clearTimeout(lastFn)

      lastFn = setTimeout(
        () => {
          if (Date.now() - lastTime >= wait) {
            fn.apply(this, args)
            lastTime = Date.now()
          }
        },
        Math.max(wait - (Date.now() - lastTime), 0)
      )
    }

    if (!inThrottle) {
      fn.apply(this, args)
      lastTime = Date.now()
      inThrottle = true
    }
  }
}
