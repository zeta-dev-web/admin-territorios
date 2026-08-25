'use client'

import { Menu } from 'lucide-react'

interface VymcHeaderProps {
  onMenuClick?: () => void
}

export function VymcHeader({ onMenuClick }: VymcHeaderProps) {
  return (
    <div className="vymc-premium-header sticky top-0 z-30 w-full">
      <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/50">
        <div className="absolute inset-0 vymc-header-gradient"></div>
        <div className="relative">
          <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
            {/* Botón de menú */}
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
              aria-label="Menú"
            >
              <Menu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>

            {/* Contenido del header */}
            <div className="flex items-center gap-3 flex-1 md:flex-none">
              <div className="vymc-header-icon flex h-12 w-12 items-center justify-center rounded-xl">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="vymc-header-title text-xl font-bold">
                  Vida y Ministerio Cristiano
                </h1>
                <p className="vymc-header-subtitle text-xs hidden sm:block">
                  Gestión de programas y asignaciones
                </p>
              </div>
            </div>

            {/* Espaciador derecho en mobile */}
            <div className="w-10 md:hidden" />
          </div>
        </div>
      </div>
    </div>
  )
}
