import { useContext } from 'react'

import { ThemeContext, LOCAL_STORAGE_THEME_KEY } from '@/components/app/providers/theme-provider'

import type { Theme } from '@/components/app/providers/theme-provider'

type UseThemeReturn = {
  theme?: Theme
  changeTheme?: (newTheme: Theme) => void
}

export const useTheme = (): UseThemeReturn => {
  const { theme, setTheme } = useContext(ThemeContext)

  const changeTheme = (newTheme: Theme): void => {
    setTheme?.(newTheme)

    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme)
  }

  return {
    theme,
    changeTheme,
  }
}
