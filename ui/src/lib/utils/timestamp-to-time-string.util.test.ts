import { timestampToTimeString } from './timestamp-to-time-string.util'

describe('timestampToTimeString util', () => {
  test('positive case', () => {
    expect(timestampToTimeString(1737917664.628)).toBe('18:54:24.628')
  })

  test('timestamp 0', () => {
    expect(timestampToTimeString(0)).toBe('00:00:00.000')
  })
})
