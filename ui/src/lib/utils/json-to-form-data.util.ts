export const jsonToFormData = (jsonObject: Record<string, string | Blob | File | File[]>): FormData => {
  const formData = new FormData()

  for (const key of Object.keys(jsonObject)) {
    const value = jsonObject[key]

    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item)
      }
    }

    if (!Array.isArray(value)) {
      formData.append(key, value)
    }
  }

  return formData
}
