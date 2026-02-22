import { t } from 'i18next'

export const validateAdbPort = (value: string, adbRange?: string): string => {
  const splittedAdbRange = adbRange?.split('-')
  const minAdbRange = Number(splittedAdbRange?.[0] || 0)
  const maxAdbRange = Number(splittedAdbRange?.[1] || 0)

  if (Number(value) < minAdbRange || Number(value) > maxAdbRange) {
    return `${t('Adb port must be in range')} ${minAdbRange} - ${maxAdbRange}`
  }

  return ''
}
