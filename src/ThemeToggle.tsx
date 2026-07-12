import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'strut-theme'

type Theme = 'light' | 'dark'

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'dark' || saved === 'light' ? saved : null
  } catch {
    return null
  }
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

/**
 * Runs before the app paints. An explicit choice wins; otherwise Strut follows the OS preference.
 * Kept as a small inline bootstrap so a dark session never flashes the light chrome on reload.
 */
export const themeBootstrapScript = `(()=>{try{let s;try{s=localStorage.getItem('${STORAGE_KEY}')}catch{}const d=s==='dark'||s==='light'?s:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=d;document.documentElement.style.colorScheme=d}catch{}})()`

export function ThemeToggle({ className = '' }: { className?: string }) {
  // SSR and hydration use the same value; the pre-paint bootstrap has already themed the document,
  // then this effect updates the icon to match without risking a hydration mismatch.
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(currentTheme())

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemTheme = (event: MediaQueryListEvent) => {
      if (savedTheme()) return
      const next = event.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }

    // Keep another open Strut tab in sync if its preference changes there.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next =
        event.newValue === 'dark' || event.newValue === 'light'
          ? event.newValue
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', onSystemTheme)
    window.addEventListener('storage', onStorage)
    return () => {
      media.removeEventListener('change', onSystemTheme)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const dark = theme === 'dark'

  function toggle() {
    const next = dark ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The theme still works for this page when storage is unavailable.
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      className={`btn theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggle}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
      aria-pressed={dark}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
