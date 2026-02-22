export const debounce = <T extends (...args: any[]) => void>(fn: T, ms: number): ((...args: unknown[]) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>

  return function func(this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), ms)
  }
}
