'use client'

import { Menu, ArrowLeft } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

const TITLES_BY_PREFIX: Array<[string, string]> = [
  ['/vymc/publishers', 'Publicadores'],
  ['/vymc/weeks', 'Programas Semanales'],
  ['/vymc', 'VYMC'],
]

function getTitleFromPathname(pathname: string): string {
  for (const [prefix, title] of TITLES_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Territorios'
}

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onMenuClick: () => void
}

export function MobileHeader({
  title,
  showBack = false,
  onMenuClick,
}: MobileHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const displayTitle = title ?? getTitleFromPathname(pathname)

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800/50 bg-white/95 dark:bg-[#0F1729]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Botón izquierdo */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menú"
            >
              <Menu className="h-5 w-5 text-cyan-600 dark:text-red-500" />
            </button>
          )}
        </div>

        {/* Título - Solo si no está vacío */}
        {displayTitle && (
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {displayTitle}
          </h1>
        )}

        {/* Espaciador derecho */}
        <div className="w-10" />
      </div>
    </header>
  )
}
