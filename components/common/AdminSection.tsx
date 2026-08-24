'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Home, Shield } from 'lucide-react'

type AdminSectionProps = {
  visible: boolean
  onNavigate?: () => void
}

/**
 * Sección colapsable de administración (Usuarios / Congregaciones).
 * Visible solo para rol ADMIN. Se ubica en el footer del sidebar,
 * arriba de "Cerrar sesión".
 */
export function AdminSection({ visible, onNavigate }: AdminSectionProps) {
  const [open, setOpen] = useState(false)

  if (!visible) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Shield className="h-5 w-5" />
        <span className="flex-1 text-left">Administración</span>
        <ChevronDown
          className={'h-4 w-4 transition-transform ' + (open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <ul className="space-y-1 pl-4">
          <li>
            <Link
              href="/admin/usuarios"
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Usuarios</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/congregaciones"
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Congregaciones</span>
            </Link>
          </li>
        </ul>
      )}
    </>
  )
}
