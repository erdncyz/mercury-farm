import { useEffect, useMemo, useState } from 'react'
import { useInjection } from 'inversify-react'
import { useTranslation } from 'react-i18next'

import { BaseSelect } from '@/components/lib/base-select'

import { CONTAINER_IDS } from '@/config/inversify/container-ids'
import { SUPPORTED_LANGUAGES } from '@/config/i18n/i18n'

import type { SelectOption } from '@/components/lib/base-select'

type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number]

const OPTION_NAMES: Record<SupportedLanguages, string> = {
  en: 'English',
  tr: 'Türkçe',
}

const LANGUAGES_OPTIONS: SelectOption<SupportedLanguages>[] = SUPPORTED_LANGUAGES.map((language) => ({
  value: language,
  name: OPTION_NAMES[language],
}))

export const LangSwitcher = () => {
  const { i18n } = useTranslation()
  const settingsService = useInjection(CONTAINER_IDS.settingsService)

  const normalizedLanguage = useMemo(() => i18n.language.split('-')[0], [i18n.language])
  const defaultLanguage =
    LANGUAGES_OPTIONS.find((option) => option.value === normalizedLanguage)?.value || LANGUAGES_OPTIONS[0].value

  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage)

  useEffect(() => {
    setCurrentLanguage(defaultLanguage)
  }, [defaultLanguage])

  const onSwitcherChange = (value: string) => {
    setCurrentLanguage(value as SupportedLanguages)

    i18n.changeLanguage(value)
    settingsService.setSelectedLanguage(value)
  }

  return <BaseSelect options={LANGUAGES_OPTIONS} value={currentLanguage} onChange={onSwitcherChange} />
}
