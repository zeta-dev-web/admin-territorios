'use client'

import { useState, ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'

interface AppLayoutProps {
  children: ReactNode
  title: string
  showBack?: boolean
}

export function AppLayout({ children, title, showBack = false }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1C]">
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

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
