import { deviceServiceToString } from './device-service-to-string.util'

describe('deviceServiceToString', () => {
  test('has GMS', () => {
    expect(deviceServiceToString({ hasGMS: true })).toBe('GMS')
  })

  test('has HMS', () => {
    expect(deviceServiceToString({ hasHMS: true })).toBe('HMS')
  })

  test('has APNS', () => {
    expect(deviceServiceToString({ hasAPNS: true })).toBe('APNS')
  })

  test('both GMS and HMS', () => {
    expect(deviceServiceToString({ hasGMS: true, hasHMS: true })).toBe('GMS, HMS')
  })
})
