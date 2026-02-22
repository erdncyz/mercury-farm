import { useMemo, useState } from 'react'

import { ThemeContext } from './theme-context'

import type { Theme } from './types'
import type { ReactNode } from 'react'

export const LOCAL_STORAGE_THEME_KEY = 'theme'

const defaultTheme = (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme) ?? 'system'

type ThemeProviderProps = {
  children: ReactNode
  initialTheme?: Theme
}

export const ThemeProvider = ({ children, initialTheme }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(initialTheme || defaultTheme)

  const themeContextValue = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  )

  return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>
}
