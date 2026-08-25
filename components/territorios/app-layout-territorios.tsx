'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/common/Sidebar'
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner'
import Footer from '@/components/layout/Footer'
import { CopilotTerritoriosChat } from '@/components/ai/copilot-territorios-chat'

interface AppLayoutTerritoriosProps {
  children: ReactNode
}

export function AppLayoutTerritorios({ children }: AppLayoutTerritoriosProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido principal */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'ml-72' : 'ml-0'
        }`}
      >
        {/* Header Premium Territorios */}
        <div className="territorios-premium-header sticky top-0 z-30 w-full">
          <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/50">
            <div className="absolute inset-0 territorios-header-gradient"></div>
            <div className="relative">
              <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Botón de menú */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Menú"
                >
                  <Menu className="h-5 w-5 text-red-600 dark:text-red-400" />
                </button>

                {/* Contenido del header */}
                <div className="flex items-center gap-3 flex-1 justify-center md:justify-start">
                  <div className="territorios-header-icon flex h-12 w-12 items-center justify-center rounded-xl">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="territorios-header-title text-xl font-bold">
                      Gestión de Territorios
                    </h1>
                    <p className="territorios-header-subtitle text-xs hidden sm:block">
                      Organización y seguimiento de asignaciones
                    </p>
                  </div>
                </div>

                {/* Espaciador derecho */}
                <div className="w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Banner de impersonación */}
        <ImpersonationBanner />

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <CopilotTerritoriosChat />
          <Footer />
        </div>
      </div>
    </div>
  )
}
