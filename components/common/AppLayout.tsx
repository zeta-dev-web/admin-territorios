'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { ImpersonationBanner } from './ImpersonationBanner'
import Footer from '@/components/layout/Footer'
import { CopilotChat } from '@/components/ai/copilot-chat'
import { CopilotTerritoriosChat } from '@/components/ai/copilot-territorios-chat'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
}

export function AppLayout({ children, title, showBack = false }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  // Determinar qué copiloto mostrar según la ruta
  const isTerritoriosModule = pathname?.startsWith('/territorios')
  const isVymcModule = pathname?.startsWith('/vymc')
  
  // Log útil para debugging
  if (typeof window !== 'undefined') {
    console.log(`[AppLayout] Ruta: ${pathname} | Territorios: ${isTerritoriosModule} | VYMC: ${isVymcModule}`)
  }

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
        {/* Header */}
        <MobileHeader
          title={title}
          showBack={showBack}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Banner de impersonación */}
        <ImpersonationBanner />

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          {/* Mostrar el copiloto según el módulo */}
          {isTerritoriosModule && <CopilotTerritoriosChat />}
          {isVymcModule && <CopilotChat />}
          <Footer />
        </div>
      </div>
    </div>
  )
}
