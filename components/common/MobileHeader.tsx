'use client'

import { Menu, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  onMenuClick: () => void
}

export function MobileHeader({
  title,
  showBack = false,
  onMenuClick,
}: MobileHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-[#0F1729]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Botón izquierdo */}
        <div className="flex items-center">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-slate-200" />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Menú"
            >
              <Menu className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>

        {/* Título */}
        <h1 className="text-lg font-bold text-white truncate">
          {title}
        </h1>

        {/* Espaciador derecho */}
        <div className="w-10" />
      </div>
    </header>
  )
}
