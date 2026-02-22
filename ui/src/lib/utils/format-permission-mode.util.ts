import { S_IFDIR, S_IFLNK, S_IFMT } from '@/constants/file-bit-masks'

export const formatPermissionMode = (value: number): string => {
  const permissionSymbols = ['x', 'w', 'r', 'x', 'w', 'r', 'x', 'w', 'r']

  const result = permissionSymbols.reduce((accumulator, item, index) => {
    if ((value >> index) & 1) {
      return item + accumulator
    }

    return '-' + accumulator
  }, '')

  if ((value & S_IFMT) === S_IFDIR) {
    return `d${result}`
  }

  if ((value & S_IFMT) === S_IFLNK) {
    return `l${result}`
  }

  return `-${result}`
}
