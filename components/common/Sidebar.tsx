'use client'

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
} from 'lucide-react'
import { logout, getCurrentUserRole, getCurrentUserCongregation } from '@/server/auth'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  icon: LucideIcon
  href: string
  adminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Territorios', icon: MapPin, href: '/admin/territories' },
  { label: 'Mapas', icon: Map, href: '/admin/maps' },
  { label: 'Conductores', icon: UserCircle, href: '/admin/drivers' },
  { label: 'Grupos', icon: Users, href: '/admin/groups' },
  { label: 'Asignaciones', icon: TrendingUp, href: '/admin/assignments' },
  { label: 'Historial', icon: History, href: '/admin/history' },
  { label: 'Usuarios', icon: Shield, href: '/admin/users', adminOnly: true },
  { label: 'Congregaciones', icon: Home, href: '/admin/congregations', adminOnly: true },
  { label: 'Tutorial', icon: BookOpen, href: '/dashboard/tutorial' },
  { label: 'Configuración', icon: Settings, href: '/dashboard/settings' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [congregationName, setCongregationName] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUserRole().then((role) => setIsAdmin(role === 'ADMIN'))
    getCurrentUserCongregation().then((name) => setCongregationName(name))
  }, [])

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
          'fixed top-0 left-0 h-full w-72 bg-[#0F1729] border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
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
                <h2 className="font-bold text-white text-sm">
                  Territorios <span className="text-cyan-300">App</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {congregationName ? `Cong. ${congregationName}` : 'Cargando...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-sm',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-950/40'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
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
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
