'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'territorios-theme'

/** Aplica el tema guardado (light/dark) a toda la app, sin importar la página. */
export function ThemeInit() {
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    document.documentElement.dataset.theme = stored === 'dark' ? 'dark' : 'light'
  }, [])
  return null
}
