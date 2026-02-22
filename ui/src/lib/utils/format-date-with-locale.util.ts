import { format } from 'date-fns'
import { enGB, ru, es, fr, ja, ko, pl, ptBR, kk, tr, zhCN, zhHK } from 'date-fns/locale'

import type { Locale } from 'date-fns'

const LOCALES: Record<string, Locale> = {
  en: enGB,
  tr,
  ['ru-RU']: ru,
  es,
  fr,
  ja,
  ko,
  pl,
  ['pt-BR']: ptBR,
  ['tt-RU']: ru,
  ['be-BY']: ru,
  ['kk-KZ']: kk,
  ['zh-CN']: zhCN,
  ['zh-Hant']: zhHK,
}

/* NOTE: By providing a default string of 'PP' or any of its variants for `formatStr`
  it will format dates in whichever way is appropriate to the locale
*/
export const formatDateWithLocale = (date: Date | string, formatStr = 'PP'): string => {
  // i18next may store extended tags (e.g. en-US); we only support specific locale keys here.
  const language = localStorage.getItem('i18nextLng') || 'en'
  const normalizedLanguage = language.split('-')[0]

  return format(date, formatStr, {
    locale: LOCALES[language] || LOCALES[normalizedLanguage] || enGB,
  })
}
