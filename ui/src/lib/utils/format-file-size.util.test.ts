import { formatFileSize } from './format-file-size.util'

describe('formatFileSize util', () => {
  test('should return "0 B" when the size is 0', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  test('should correctly format size for values less than 1024 bytes', () => {
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  test('should correctly format size for values in Kb', () => {
    expect(formatFileSize(2048)).toBe('2 Kb')
  })

  test('should correctly format size for values in Mb', () => {
    expect(formatFileSize(10485760)).toBe('10 Mb')
  })

  test('should correctly format size for values in Gb', () => {
    expect(formatFileSize(1073741824)).toBe('1 Gb')
  })

  test('should round sizes correctly to the specified decimal places', () => {
    expect(formatFileSize(1234)).toBe('1 Kb')
    expect(formatFileSize(1234567, 3)).toBe('1.177 Mb')
  })
})
