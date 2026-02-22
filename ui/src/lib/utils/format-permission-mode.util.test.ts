import { formatPermissionMode } from './format-permission-mode.util'

describe('formatPermissionMode util', () => {
  test('should format permissions for a directory S_IFDIR', () => {
    expect(formatPermissionMode(0o40755)).toBe('drwxr-xr-x')
  })

  test('should format permissions for a symbolic link S_IFLNK', () => {
    expect(formatPermissionMode(0o120755)).toBe('lrwxr-xr-x')
  })

  test('should format permissions for a regular file', () => {
    expect(formatPermissionMode(0o100755)).toBe('-rwxr-xr-x')
  })

  test('should return "-" for no permissions', () => {
    expect(formatPermissionMode(0o0)).toBe('----------')
  })

  test('should format permissions correctly for file with only read permission', () => {
    expect(formatPermissionMode(0o444)).toBe('-r--r--r--')
  })

  test('should format permissions correctly for file with only execute permission', () => {
    expect(formatPermissionMode(0o111)).toBe('---x--x--x')
  })
})
