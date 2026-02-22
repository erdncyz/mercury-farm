export const saveFile = async (blob: Blob, fileName: string): Promise<void> => {
  if (window.showSaveFilePicker) {
    const fileHandle = await window.showSaveFilePicker({ suggestedName: fileName })
    const writableStream = await fileHandle.createWritable()

    await writableStream.write(blob)
    await writableStream.close()
  }

  if (!window.showSaveFilePicker) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    window.URL.revokeObjectURL(url)
  }
}
