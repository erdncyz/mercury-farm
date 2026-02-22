import { throttle } from './throttle.util'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should call the function immediately and not call it again within the delay', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)

    throttledFn()
    throttledFn()

    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1000)

    throttledFn()

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('should execute the last call after the delay', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)

    throttledFn()
    throttledFn()
    throttledFn()
    throttledFn()

    vi.advanceTimersByTime(1000)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('should not call the function if there were no calls after the delay', () => {
    const fn = vi.fn()
    const throttledFn = throttle(fn, 1000)

    throttledFn()

    vi.advanceTimersByTime(1000)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
