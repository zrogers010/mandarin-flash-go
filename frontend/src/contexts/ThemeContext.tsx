import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'theme'

function getStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return pref
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  // Keep the mobile browser chrome color in sync with the surface color.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b1220' : '#0d7377')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredPreference)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(getStoredPreference()))

  useEffect(() => {
    const resolved = resolve(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [theme])

  // React to OS-level changes only while following the system preference.
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = systemPrefersDark() ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyTheme(resolved)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore storage failures (e.g. private mode); theme still applies for the session.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
