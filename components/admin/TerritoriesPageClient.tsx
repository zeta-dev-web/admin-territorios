'use client'

import { useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { TerritoriesTableWithModal } from './TerritoriesTableWithModal'
import { TerritoryModal } from './TerritoryModal'
import { Pagination } from '@/components/common/Pagination'

interface Territory {
  id: string
  number: number
  description: string | null
  groupId: string
  blocks: Array<{ letter: string }>
  assignments: Array<{
    startDate: Date
    isCompleted: boolean
    driver: { name: string; group: { name: string } }
  }>
  personalAssignments: Array<{
    member: { name: string; group: { name: string } }
  }>
  _count: { assignments: number; personalAssignments: number }
  lastAssignmentDate?: Date | null
}

interface Group {
  id: string
  name: string
}

interface Props {
  territories: Territory[]
  groups: Group[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  territoriesWithAssignments: number
  totalBlocks: number
}

export function TerritoriesPageClient({
  territories, groups, page, pageSize, total, totalPages,
  territoriesWithAssignments, totalBlocks,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
            <MapPin className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Territorios</h1>
            <p className="text-sm text-slate-400">
              Gestiona todos los territorios y sus manzanas
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 px-4 py-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Nuevo Territorio</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Total Territorios</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{total}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Con Asignaciones</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{territoriesWithAssignments}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Total Manzanas</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{totalBlocks}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1729] rounded-xl border border-slate-800">
        <TerritoriesTableWithModal territories={territories} groups={groups} />
        <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} />
      </div>

      {/* Modal de creación */}
      <TerritoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        territory={null}
        groups={groups}
      />
    </>
  )
}
