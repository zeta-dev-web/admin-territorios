'use client'

import { useState, useMemo } from 'react'
import { Plus, MapPin, Search, X } from 'lucide-react'
import { TerritoriesTableWithModal } from './TerritoriesTableWithModal'
import { TerritoryModal } from './TerritoryModal'
import { ClientPagination } from '@/components/common/ClientPagination'

interface Territory {
  id: string
  number: number
  description: string | null
  groupId: string
  blocks: Array<{ letter: string }>
  assignments: Array<{
    startDate: Date
    isCompleted: boolean
    driver: { name?: string | null; group?: { name: string } | null } | null
  }>
  personalAssignments: Array<{
    member: { name?: string | null; group?: { name: string } | null } | null
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
  total: number
  territoriesWithAssignments: number
  totalBlocks: number
}

export function TerritoriesPageClient({
  territories, groups, total,
  territoriesWithAssignments, totalBlocks,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [assignmentStatus, setAssignmentStatus] = useState<'all' | 'assigned' | 'free'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filtrar territorios por búsqueda, grupo y estado de asignación
  const filteredTerritories = useMemo(() => {
    return territories.filter((territory) => {
      const matchesSearch = 
        searchTerm === '' ||
        territory.number.toString().includes(searchTerm) ||
        (territory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesGroup = 
        selectedGroup === 'all' ||
        territory.groupId === selectedGroup

      const hasActiveAssignment = 
        territory.assignments.length > 0 || 
        territory.personalAssignments.length > 0

      const matchesStatus = 
        assignmentStatus === 'all' ||
        (assignmentStatus === 'assigned' && hasActiveAssignment) ||
        (assignmentStatus === 'free' && !hasActiveAssignment)

      return matchesSearch && matchesGroup && matchesStatus
    })
  }, [territories, searchTerm, selectedGroup, assignmentStatus])

  // Paginación local
  const totalPages = Math.ceil(filteredTerritories.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTerritories = filteredTerritories.slice(startIndex, startIndex + pageSize)

  // Reset página cuando cambian los filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: 'all' | 'assigned' | 'free') => {
    setAssignmentStatus(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setAssignmentStatus('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || selectedGroup !== 'all' || assignmentStatus !== 'all'

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

      {/* Filtros */}
      <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Filtros</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Buscar por número o zona
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Ej: 3, Centro, Plaza..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Filtro por grupo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filtrar por grupo
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado de asignación */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estado de asignación
            </label>
            <select
              value={assignmentStatus}
              onChange={(e) => handleStatusChange(e.target.value as 'all' | 'assigned' | 'free')}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Todos</option>
              <option value="assigned">Asignados</option>
              <option value="free">Libres</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Mostrando <span className="text-red-500 font-semibold">{filteredTerritories.length}</span> de {total} territorios
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0F1729] rounded-xl border border-slate-800">
        <TerritoriesTableWithModal territories={paginatedTerritories} groups={groups} />
        {filteredTerritories.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No se encontraron territorios con los filtros aplicados</p>
          </div>
        ) : (
          <ClientPagination 
            page={currentPage} 
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
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
