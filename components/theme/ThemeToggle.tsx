'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'territorios-theme'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme: Theme = stored === 'dark' ? 'dark' : 'light'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [])

  const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={() => {
        setTheme(nextTheme)
        applyTheme(nextTheme)
      }}
      aria-label={`Cambiar a tema ${nextTheme === 'dark' ? 'oscuro' : 'claro'}`}
      title={`Tema ${theme === 'dark' ? 'oscuro' : 'claro'}`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === 'dark' ? <Moon size={15} strokeWidth={2.2} /> : <Sun size={15} strokeWidth={2.2} />}
      </span>
      <span className="theme-toggle__label">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
      <span className="theme-toggle__switch" aria-hidden="true">
        <span />
      </span>
    </button>
  )
}
