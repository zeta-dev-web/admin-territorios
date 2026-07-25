'use client'

import { useState } from 'react'
import { Home, Plus, Info } from 'lucide-react'
import { CongregationsTable } from './CongregationsTable'
import { CongregationModal } from './CongregationModal'
import { AppLayout } from '@/components/common/AppLayout'

interface Congregation {
  id: string
  name: string
  createdAt: Date
  _count: {
    users: number
    groups: number
    territories: number
  }
}

interface CongregationsPageClientProps {
  congregations: Congregation[]
}

export function CongregationsPageClient({ congregations }: CongregationsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <AppLayout title="Congregaciones">
      <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Home className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de Congregaciones</h1>
              <p className="text-sm text-slate-400 mt-1">
                Administra las congregaciones del sistema
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-500/20"
          >
            <Plus className="h-5 w-5" />
            Nueva Congregación
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Acerca de las congregaciones</p>
            <p className="text-blue-300/80">
              Cada congregación es independiente y tiene sus propios usuarios, grupos y territorios.
              Los usuarios solo pueden ver y gestionar los datos de su congregación asignada.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Congregaciones</p>
              <p className="text-2xl font-bold text-white mt-1">{congregations.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Home className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Usuarios Totales</p>
              <p className="text-2xl font-bold text-white mt-1">
                {congregations.reduce((sum, c) => sum + c._count.users, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Territorios Totales</p>
              <p className="text-2xl font-bold text-white mt-1">
                {congregations.reduce((sum, c) => sum + c._count.territories, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden">
        <CongregationsTable congregations={congregations} />
      </div>

      {/* Modal */}
      <CongregationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      </div>
    </AppLayout>
  )
}
