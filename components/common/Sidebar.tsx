'use client'

import { AdminSection } from '@/components/common/AdminSection'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  MapPin,
  Users,
  UserCircle,
  LogOut,
  X,
  TrendingUp,
  History,
  Map,
  Shield,
  Settings,
  BookOpen,
  Home,
  CalendarDays,
  MessageCircle,
} from 'lucide-react'
import { logout, getCurrentUserRole, getCurrentUserCongregation } from '@/server/auth'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  icon: LucideIcon
  href: string
  adminOnly?: boolean
  exact?: boolean
}

type ModuleId = 'territorios' | 'vymc'

const modules: Array<{
  id: ModuleId
  label: string
  icon: LucideIcon
  home: string
}> = [
  { id: 'territorios', label: 'Territorios', icon: MapPin, home: '/territorios' },
  { id: 'vymc', label: 'VYMC', icon: CalendarDays, home: '/vymc' },
]

const territoriosMenu: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/territorios', exact: true },
  { label: 'Territorios', icon: MapPin, href: '/territorios/lista' },
  { label: 'Mapas', icon: Map, href: '/territorios/mapas' },
  { label: 'Publicadores', icon: Users, href: '/territorios/publicadores' },
  { label: 'Asignaciones', icon: TrendingUp, href: '/territorios/asignaciones' },
  { label: 'Historial', icon: History, href: '/territorios/historial' },
  { label: 'Tutorial', icon: BookOpen, href: '/territorios/tutorial' },
  { label: 'Configuración', icon: Settings, href: '/configuracion' },
]

const vymcMenu: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/vymc', exact: true },
  { label: 'Programas', icon: CalendarDays, href: '/vymc/programas' },
  { label: 'Publicadores', icon: Users, href: '/vymc/publicadores' },
  { label: 'WhatsApp', icon: MessageCircle, href: '/vymc/whatsapp' },
]

const menusByModule: Record<ModuleId, MenuItem[]> = {
  territorios: territoriosMenu,
  vymc: vymcMenu,
}

function getActiveModule(pathname: string): ModuleId {
  return pathname.startsWith('/vymc') ? 'vymc' : 'territorios'
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [congregationName, setCongregationName] = useState<string | null>(null)

  const activeModule = getActiveModule(pathname)

  useEffect(() => {
    getCurrentUserRole().then((role) => setIsAdmin(role === 'ADMIN'))
    getCurrentUserCongregation().then((name) => setCongregationName(name))
  }, [])

  const menuItems = menusByModule[activeModule]

  const visibleItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-1 rounded-xl bg-cyan-400/30 blur-lg" />
                <BrandMark
                  size={44}
                  className="relative h-11 w-11"
                  priority
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Territorios <span className="text-cyan-600 dark:text-cyan-400">App</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {congregationName ? `Cong. ${congregationName}` : 'Cargando...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Selector de módulo */}
          <div className="p-4 pb-0">
            <div className="module-switcher grid grid-cols-2 gap-1 rounded-xl p-1">
              {modules.map((mod) => {
                const Icon = mod.icon
                const isActive = mod.id === activeModule

                return (
                  <Link
                    key={mod.id}
                    href={mod.home}
                    onClick={onClose}
                    data-active={isActive ? "true" : undefined}
                    className={cn(
                      'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'module-switcher-active'
                        : 'module-switcher-inactive'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{mod.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 space-y-2">
            <AdminSection visible={isAdmin} onNavigate={onClose} />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="h-5 w-5" />
              <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
