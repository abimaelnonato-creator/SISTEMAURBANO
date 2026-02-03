import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '@/store/appStore'

type Theme = 'light' | 'dark' | 'system'
type ActualTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  actualTheme: ActualTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Usar seletores individuais para evitar re-renders desnecessários
  const theme = useAppStore((state) => state.theme)
  const setThemeInStore = useAppStore((state) => state.setTheme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const [actualTheme, setActualTheme] = useState<ActualTheme>('light')

  useEffect(() => {
    const root = document.documentElement

    const getSystemTheme = (): ActualTheme =>
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    const applyTheme = (value: ActualTheme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(value)
      setActualTheme(value)
    }

    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      applyTheme(systemTheme)

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (event: MediaQueryListEvent) => applyTheme(event.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }

    applyTheme(theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      actualTheme,
      setTheme: setThemeInStore,
      toggleTheme,
    }),
    [actualTheme, theme, toggleTheme, setThemeInStore]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
