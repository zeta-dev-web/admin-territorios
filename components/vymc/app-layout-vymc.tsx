'use client'

import { useState, ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/common/Sidebar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ImpersonationBanner } from '@/components/common/ImpersonationBanner'
import Footer from '@/components/layout/Footer'
import { CopilotChat } from '@/components/ai/copilot-chat'

interface AppLayoutVymcProps {
  children: ReactNode
}

export function AppLayoutVymc({ children }: AppLayoutVymcProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido principal */}
      <div 
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-72' : 'ml-0'
        }`}
      >
        {/* Header Premium VYMC */}
        <div className="vymc-premium-header sticky top-0 z-30 w-full">
          <div className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/50">
            <div className="absolute inset-0 vymc-header-gradient"></div>
            <div className="relative">
              <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Botón de menú */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="flex items-center justify-center w-10 h-10 -ml-3 mr-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Menú"
                >
                  <Menu className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </button>

                {/* Contenido del header */}
                <div className="flex min-w-0 items-center gap-3 flex-1 justify-center md:justify-start">
                  <div className="vymc-header-icon flex h-12 w-12 items-center justify-center rounded-xl">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="vymc-header-title text-base sm:text-xl font-bold whitespace-nowrap truncate">
                      Vida y Ministerio Cristiano
                    </h1>
                    <p className="vymc-header-subtitle text-xs hidden sm:block">
                      Gestión de programas y asignaciones
                    </p>
                  </div>
                </div>

                {/* Toggle de tema a la derecha */}
                <ThemeToggle className="theme-toggle--compact" />
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
          <CopilotChat />
          <Footer />
        </div>
      </div>
    </div>
  )
}
