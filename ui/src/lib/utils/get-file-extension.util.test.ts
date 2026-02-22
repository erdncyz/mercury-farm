import { getFileExtension } from './get-file-extension.util'

describe('getFileExtension util', () => {
  it('should return the correct extension for a file with an extension', () => {
    expect(getFileExtension(new File(['content'], 'example.test.JPG'))).toBe('.jpg')
  })

  it('should return an empty string for a file without an extension', () => {
    expect(getFileExtension(new File(['content'], 'example'))).toBe('')
  })

  it('should return an empty string if file name is empty', () => {
    expect(getFileExtension(new File(['content'], ''))).toBe('')
  })
})
