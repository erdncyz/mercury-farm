import { createContext } from 'react'

import type { Theme } from './types'

type ThemeContextProps = {
  theme?: Theme
  setTheme?: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextProps>({})
