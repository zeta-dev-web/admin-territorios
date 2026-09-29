'use client'

import { AdminSection } from '@/components/common/AdminSection'
import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  MapPin,
  Users,
  LogOut,
  X,
  TrendingUp,
  History,
  Map,
  Settings,
  BookOpen,
  Home,
  CalendarDays,
  MessageCircle,
  ChevronDown,
  Check,
} from 'lucide-react'
import { logout, getCurrentUserRole, getCurrentUserCongregation, getCurrentUserModules } from '@/server/auth'
import { cn } from '@/lib/utils'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { ModuleCode } from '@/lib/module-access'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  icon: LucideIcon
  href: string
  exact?: boolean
}

const modules: Array<{
  id: ModuleCode
  label: string
  icon: LucideIcon
  home: string
}> = [
  { id: 'TERRITORIES', label: 'Territorios', icon: MapPin, home: '/territorios' },
  { id: 'VYMC', label: 'VYMC', icon: CalendarDays, home: '/vymc' },
]

const territoriosMenu: MenuItem[] = [
  { label: 'Todos los módulos', icon: Home, href: '/inicio', exact: true },
  { label: 'Resumen', icon: LayoutDashboard, href: '/territorios', exact: true },
  { label: 'Territorios', icon: MapPin, href: '/territorios/lista' },
  { label: 'Mapas', icon: Map, href: '/territorios/mapas' },
  { label: 'Publicadores', icon: Users, href: '/territorios/publicadores' },
  { label: 'Asignaciones', icon: TrendingUp, href: '/territorios/asignaciones' },
  { label: 'Historial', icon: History, href: '/territorios/historial' },
  { label: 'Tutorial', icon: BookOpen, href: '/territorios/tutorial' },
]

const vymcMenu: MenuItem[] = [
  { label: 'Todos los módulos', icon: Home, href: '/inicio', exact: true },
  { label: 'Resumen', icon: LayoutDashboard, href: '/vymc', exact: true },
  { label: 'Programas', icon: CalendarDays, href: '/vymc/programas' },
  { label: 'Publicadores', icon: Users, href: '/vymc/publicadores' },
  { label: 'WhatsApp', icon: MessageCircle, href: '/vymc/whatsapp' },
]

const menusByModule: Record<ModuleCode, MenuItem[]> = {
  TERRITORIES: territoriosMenu,
  VYMC: vymcMenu,
}

function getActiveModule(pathname: string, allowedModules: ModuleCode[]): ModuleCode {
  if (pathname.startsWith('/vymc')) return 'VYMC'
  if (pathname.startsWith('/territorios')) return 'TERRITORIES'
  return allowedModules[0] ?? 'TERRITORIES'
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [congregationName, setCongregationName] = useState<string | null>(null)
  const [allowedModules, setAllowedModules] = useState<ModuleCode[]>([])
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const activeModule = getActiveModule(pathname, allowedModules)
  const currentModule = modules.find((module) => module.id === activeModule)!
  const CurrentModuleIcon = currentModule.icon
  const availableModules = modules.filter((module) => allowedModules.includes(module.id))

  useEffect(() => {
    getCurrentUserRole().then((role) => setIsAdmin(role === 'ADMIN'))
    getCurrentUserCongregation().then((name) => setCongregationName(name))
    getCurrentUserModules().then(setAllowedModules)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = document.activeElement as HTMLElement
    closeButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isModuleMenuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setIsModuleMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isModuleMenuOpen])

  const menuItems = menusByModule[activeModule]

  function closeSidebar() {
    setIsModuleMenuOpen(false)
    onClose()
    previousFocusRef.current?.focus()
  }

  function handleNavigate() {
    setIsModuleMenuOpen(false)
    onClose()
  }

  function handleSidebarKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      if (isModuleMenuOpen) {
        setIsModuleMenuOpen(false)
        selectorRef.current?.querySelector('button')?.focus()
      } else {
        closeSidebar()
      }
      return
    }
    if (event.key !== 'Tab') return
    const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-label="Cerrar menú"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        inert={!isOpen}
        data-module={activeModule}
        onKeyDown={handleSidebarKeyDown}
        className={cn(
          'sidebar fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <BrandMark
                  size={40}
                  className="h-10 w-10"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h2 className="sidebar-brand font-bold text-sm">
                  Recursos <span className="sidebar-brand-accent">App</span>
                </h2>
                <p className="sidebar-brand-sub truncate text-xs" title={congregationName ?? undefined}>
                  {congregationName ? `Cong. ${congregationName}` : 'Cargando...'}
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Selector de módulo */}
          <div ref={selectorRef} className="px-4 pt-5">
            <p className="sidebar-section-label px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Módulo actual</p>
            <button
              type="button"
              onClick={() => setIsModuleMenuOpen((open) => !open)}
              disabled={availableModules.length < 2}
              aria-expanded={availableModules.length > 1 ? isModuleMenuOpen : undefined}
              aria-controls={availableModules.length > 1 ? 'sidebar-module-options' : undefined}
              className="sidebar-module-trigger flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-default"
            >
              <span className="sidebar-module-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                <CurrentModuleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="flex-1">{currentModule.label}</span>
              {availableModules.length > 1 && (
                <ChevronDown className={cn('h-4 w-4 transition-transform', isModuleMenuOpen && 'rotate-180')} aria-hidden="true" />
              )}
            </button>
            {isModuleMenuOpen && availableModules.length > 1 && (
              <div id="sidebar-module-options" className="sidebar-module-options mt-2 space-y-1 rounded-lg border p-1.5">
                {availableModules.map((module) => {
                  const Icon = module.icon
                  return (
                    <Link
                      key={module.id}
                      href={module.home}
                      onClick={handleNavigate}
                      data-current={module.id === activeModule ? 'true' : undefined}
                      className="sidebar-module-option flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex-1">{module.label}</span>
                      {module.id === activeModule && <Check className="h-4 w-4" aria-hidden="true" />}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Menu */}
          <nav aria-label="Navegación del módulo" className="flex-1 p-4 overflow-y-auto">
            <p className="sidebar-section-label px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Navegación</p>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'sidebar-nav-link flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                        isActive && 'sidebar-nav-link-active'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 space-y-1 overflow-y-auto">
            <AdminSection visible={isAdmin} onNavigate={handleNavigate} />
            
            {/* Configuración (para todos los usuarios) */}
            <Link
              href="/configuracion"
              onClick={handleNavigate}
              aria-current={pathname === '/configuracion' ? 'page' : undefined}
              className={cn(
                'sidebar-nav-link flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
                pathname === '/configuracion' && 'sidebar-nav-link-active'
              )}
            >
              <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>Configuración</span>
            </Link>
            
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="sidebar-nav-link flex min-h-11 w-full items-center gap-3 rounded-lg border-l-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
