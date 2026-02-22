export const getFileExtension = (file: File): string => {
  const dotPosition = file.name.lastIndexOf('.')

  if (dotPosition === -1) return ''

  return file.name.slice(dotPosition).toLowerCase()
}
