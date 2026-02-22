import { formatDateWithLocale } from './format-date-with-locale.util'

type DateToFormattedStringOptions = {
  value: Date | string
  needTime?: boolean
  onlyTime?: boolean
}

export const dateToFormattedString = ({
  value,
  needTime = false,
  onlyTime = false,
}: DateToFormattedStringOptions): string => {
  if (!value) return ''

  if (onlyTime) return formatDateWithLocale(value, 'HH:mm')

  return formatDateWithLocale(value, needTime ? 'dd MMMM yyyy HH:mm' : 'dd MMMM yyyy')
}
