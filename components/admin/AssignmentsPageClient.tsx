'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, Search, X } from 'lucide-react'
import { UnifiedAssignmentsTable } from './UnifiedAssignmentsTable'
import { CreateAssignmentModal } from './CreateAssignmentModal'
import { CreatePersonalAssignmentModal } from './CreatePersonalAssignmentModal'
import { ClientPagination } from '@/components/common/ClientPagination'

interface Assignment {
  id: string
  type: 'conductor' | 'personal'
  territoryId: string
  territoryNumber: number
  territoryDescription: string | null
  assigneeId: string
  assigneeName: string
  groupName: string
  startDate: Date
  assignedDate: Date
  endDate: Date | null
  isActive: boolean
  isCompleted: boolean
  blocks: Array<{ letter: string; isCompleted: boolean }>
  totalBlocks: number
  completedBlocks: number
  progressPercentage: number
}

interface Props {
  assignments: Assignment[]
  total: number
  conductorCount: number
  personalCount: number
  uniqueTerritories: number
}

export function AssignmentsPageClient({
  assignments,
  total,
  conductorCount,
  personalCount,
  uniqueTerritories,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'conductor' | 'personal'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Extraer grupos únicos de las asignaciones
  const groups = useMemo(() => {
    const uniqueGroups = new Set(assignments.map((a) => a.groupName))
    return Array.from(uniqueGroups).sort()
  }, [assignments])

  // Filtrar asignaciones
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        searchTerm === '' ||
        assignment.territoryNumber.toString().includes(searchTerm) ||
        assignment.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.territoryDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesGroup =
        selectedGroup === 'all' ||
        assignment.groupName === selectedGroup

      const matchesType =
        selectedType === 'all' ||
        assignment.type === selectedType

      return matchesSearch && matchesGroup && matchesType
    })
  }, [assignments, searchTerm, selectedGroup, selectedType])

  // Paginación local
  const totalPages = Math.ceil(filteredAssignments.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + pageSize)

  // Reset página cuando cambian los filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value)
    setCurrentPage(1)
  }

  const handleTypeChange = (value: 'all' | 'conductor' | 'personal') => {
    setSelectedType(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setSelectedType('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || selectedGroup !== 'all' || selectedType !== 'all'

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Asignaciones</h1>
            <p className="text-sm text-slate-400">
              Todas las asignaciones activas en un solo lugar
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <CreateAssignmentModal />
          <CreatePersonalAssignmentModal />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Total Activas</p>
          <p className="text-2xl font-bold text-purple-500 mt-1">{total}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Conductores</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{conductorCount}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Personales</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{personalCount}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Territorios Únicos</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{uniqueTerritories}</p>
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
              Buscar por territorio o conductor
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Ej: 3, Juan, Centro..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de asignación
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as 'all' | 'conductor' | 'personal')}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos</option>
              <option value="conductor">Conductor</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Mostrando <span className="text-purple-500 font-semibold">{filteredAssignments.length}</span> de {total} asignaciones
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0F1729] rounded-xl border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Todas las Asignaciones</h2>
          <div className="flex gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Conductor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Personal
            </span>
          </div>
        </div>
        <UnifiedAssignmentsTable assignments={paginatedAssignments} />
        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No se encontraron asignaciones con los filtros aplicados</p>
          </div>
        ) : (
          <ClientPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </>
  )
}
