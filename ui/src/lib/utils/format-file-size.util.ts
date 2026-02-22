export const formatFileSize = (bytes: number, decimals: number = 0): string => {
  if (bytes === 0) return '0 B'

  const bytesInKb = 1024
  const sizeUnits = ['B', 'Kb', 'Mb', 'Gb']

  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(bytesInKb))

  return `${parseFloat((bytes / Math.pow(bytesInKb, sizeIndex)).toFixed(decimals))} ${sizeUnits[sizeIndex]}`
}
