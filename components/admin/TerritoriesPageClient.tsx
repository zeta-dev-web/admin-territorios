'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, MapPin, Search, X, Loader2, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerritoriesTableWithModal } from './TerritoriesTableWithModal'
import { TerritoryModal } from './TerritoryModal'
import { ClientPagination } from '@/components/common/ClientPagination'
import { getUnassignedTerritories } from '@/server/territories'

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
  // Filtro exacto de periodo: se resuelve en el servidor (ninguna asignación
  // de conductor ni personal iniciada en el rango) y se cruza por id.
  const [periodFilter, setPeriodFilter] = useState<'all' | 'never' | '30' | '90' | '180' | 'custom'>('all')
  const [periodDesde, setPeriodDesde] = useState('')
  const [periodHasta, setPeriodHasta] = useState('')
  const [unassignedIds, setUnassignedIds] = useState<Set<string> | null>(null)
  const [periodLoading, setPeriodLoading] = useState(false)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const periodCache = useRef(new Map<string, Set<string>>())
  const periodRequest = useRef(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  // Filtros colapsables en mobile
  const [showFilters, setShowFilters] = useState(false)

  const periodActive =
    periodFilter !== 'all' && !(periodFilter === 'custom' && !periodDesde && !periodHasta)

  useEffect(() => {
    if (!periodActive) return

    let params: { desde?: string | Date; hasta?: string | Date }
    if (periodFilter === 'never') {
      params = {}
    } else if (periodFilter === 'custom') {
      params = { desde: periodDesde || undefined, hasta: periodHasta || undefined }
    } else {
      const desde = new Date()
      desde.setDate(desde.getDate() - Number(periodFilter))
      desde.setHours(0, 0, 0, 0)
      params = { desde }
    }
    const cacheKey = JSON.stringify({
      d: params.desde instanceof Date ? params.desde.toISOString() : (params.desde ?? null),
      h: params.hasta instanceof Date ? (params.hasta as Date).toISOString() : (params.hasta ?? null),
    })
    const cached = periodCache.current.get(cacheKey)
    if (cached) {
      setUnassignedIds(cached)
      setPeriodError(null)
      setPeriodLoading(false)
      return
    }

    const token = ++periodRequest.current
    setPeriodLoading(true)
    setPeriodError(null)
    getUnassignedTerritories(params)
      .then((res) => {
        if (periodRequest.current !== token) return
        setPeriodLoading(false)
        if (res.success) {
          const ids = new Set(res.data.map((t) => t.id))
          periodCache.current.set(cacheKey, ids)
          setUnassignedIds(ids)
        } else {
          setPeriodError(res.message ?? 'No se pudo aplicar el filtro de periodo')
        }
      })
      .catch(() => {
        if (periodRequest.current !== token) return
        setPeriodLoading(false)
        setPeriodError('No se pudo aplicar el filtro de periodo')
      })
  }, [periodActive, periodFilter, periodDesde, periodHasta])

  // Filtrar territorios por búsqueda, grupo, estado de asignación y periodo
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

      const matchesPeriod =
        unassignedIds === null || unassignedIds.has(territory.id)

      return matchesSearch && matchesGroup && matchesStatus && matchesPeriod
    })
  }, [territories, searchTerm, selectedGroup, assignmentStatus, unassignedIds])

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

  const resetPeriodResult = () => {
    periodRequest.current += 1
    setUnassignedIds(null)
    setPeriodError(null)
    setPeriodLoading(false)
  }

  const handlePeriodChange = (value: 'all' | 'never' | '30' | '90' | '180' | 'custom') => {
    setPeriodFilter(value)
    if (value === 'all' || value === 'custom') resetPeriodResult()
    setCurrentPage(1)
  }

  const handlePeriodDateChange = (which: 'desde' | 'hasta', value: string) => {
    const nextDesde = which === 'desde' ? value : periodDesde
    const nextHasta = which === 'hasta' ? value : periodHasta
    if (which === 'desde') setPeriodDesde(value)
    else setPeriodHasta(value)
    if (!nextDesde && !nextHasta) resetPeriodResult()
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setAssignmentStatus('all')
    setPeriodFilter('all')
    setPeriodDesde('')
    setPeriodHasta('')
    setUnassignedIds(null)
    setPeriodError(null)
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== '' || selectedGroup !== 'all' || assignmentStatus !== 'all' || periodFilter !== 'all'

  const activeFilterCount =
    (searchTerm !== '' ? 1 : 0) +
    (selectedGroup !== 'all' ? 1 : 0) +
    (assignmentStatus !== 'all' ? 1 : 0) +
    (periodFilter !== 'all' ? 1 : 0)

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

        <Button
          onClick={() => setCreateOpen(true)}
          variant="default"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Nuevo Territorio</span>
        </Button>
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
          <h3 className="hidden md:block text-sm font-semibold text-white">Filtros</h3>
          <Button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            variant="ghost"
            size="sm"
            className="md:hidden font-semibold text-white"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-red-500 text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Filtro por periodo sin asignar (exacto, servidor) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sin asignar en periodo
            </label>
            <select
              value={periodFilter}
              onChange={(e) => handlePeriodChange(e.target.value as 'all' | 'never' | '30' | '90' | '180' | 'custom')}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]"
            >
              <option value="all">Todos</option>
              <option value="never">Nunca asignados</option>
              <option value="30">Sin asignar hace 1 mes</option>
              <option value="90">Sin asignar hace 3 meses</option>
              <option value="180">Sin asignar hace 6 meses</option>
              <option value="custom">Periodo específico…</option>
            </select>
          </div>
        </div>

        {/* Rango personalizado */}
        {periodFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={periodDesde}
                max={periodHasta || undefined}
                onChange={(e) => handlePeriodDateChange('desde', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={periodHasta}
                min={periodDesde || undefined}
                onChange={(e) => handlePeriodDateChange('hasta', e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]"
              />
            </div>
          </div>
        )}

        {/* Estado del filtro de periodo */}
        {periodLoading && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando territorios sin asignar en el periodo…
          </div>
        )}
        {periodError && (
          <div className="mt-3 text-sm text-red-400">
            {periodError}
          </div>
        )}

        {/* Contador de resultados */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Mostrando <span className="text-red-500 font-semibold">{filteredTerritories.length}</span> de {total} territorios
            </p>
          </div>
        )}
        </div>
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
