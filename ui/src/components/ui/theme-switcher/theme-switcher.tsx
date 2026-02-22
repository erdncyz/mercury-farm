import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { BaseSelect } from '@/components/lib/base-select'

import { useTheme } from '@/lib/hooks/use-theme.hook'

import type { SelectOption } from '@/components/lib/base-select'
import type { Theme } from '@/components/app/providers/theme-provider'

export const ThemeSwitcher = () => {
  const { theme, changeTheme } = useTheme()
  const { t } = useTranslation()

  const themeOptions: SelectOption<Theme>[] = useMemo(
    () => [
      {
        value: 'light',
        name: t('Light'),
      },
      {
        value: 'dark',
        name: t('Dark'),
      },
      {
        value: 'system',
        name: t('System'),
      },
    ],
    [t]
  )

  const onSwitcherChange = (value: string) => {
    changeTheme?.(value as Theme)
  }

  return <BaseSelect options={themeOptions} value={theme} onChange={onSwitcherChange} />
}
