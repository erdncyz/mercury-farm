import { formatDateWithLocale } from './format-date-with-locale.util'

export const timestampToTimeString = (value: number): string =>
  formatDateWithLocale(new Date(value * 1000), 'HH:mm:ss.SSS')
