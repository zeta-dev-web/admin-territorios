'use client'

import { useState, useMemo } from 'react'
import { 
  MapPin, UserCircle, Calendar, Clock, CheckCircle2, 
  Search, Filter, Trash2, AlertTriangle, X,
  User, UserCog
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { deleteHistoryRecord } from '@/server'
import { useRouter } from 'next/navigation'
import { Table } from '@/components/common/Table'

interface UnifiedHistoryRecord {
  id: string
  type: 'CONDUCTOR' | 'PERSONAL'
  territoryId: string
  territoryNumber: number
  territoryDescription: string | null
  assigneeId: string
  assigneeName: string
  groupName: string
  assignedDate: Date
  endDate: Date | null
  isActive: boolean
  isCompleted: boolean
  notes?: string | null
}

interface HistoryTableProps {
  assignments: UnifiedHistoryRecord[]
}

export function HistoryTable({ assignments }: HistoryTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Obtener años únicos de las asignaciones
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    assignments.forEach(a => {
      if (a.endDate) {
        years.add(a.endDate.getFullYear())
      }
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [assignments])

  // Filtrar asignaciones
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = searchTerm === '' || 
        assignment.territoryNumber.toString().includes(searchTerm) ||
        assignment.assigneeName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesYear = selectedYear === 'all' || 
        (assignment.endDate && assignment.endDate.getFullYear().toString() === selectedYear)

      const matchesMonth = selectedMonth === 'all' || 
        (assignment.endDate && (assignment.endDate.getMonth() + 1).toString() === selectedMonth)

      const matchesType = selectedType === 'all' || assignment.type === selectedType

      return matchesSearch && matchesYear && matchesMonth && matchesType
    })
  }, [assignments, searchTerm, selectedYear, selectedMonth, selectedType])

  const handleDelete = async (id: string, type: 'CONDUCTOR' | 'PERSONAL') => {
    setDeleting(true)
    try {
      const result = await deleteHistoryRecord(id, type)
      if (result.success) {
        setDeleteConfirm(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
    } finally {
      setDeleting(false)
    }
  }

  // Calcular duración de la asignación
  const calculateDuration = (startDate: Date, endDate: Date | null) => {
    if (!endDate) return '-'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '< 1 día'
    if (diffDays === 1) return '1 día'
    if (diffDays < 7) return `${diffDays} días`
    
    const weeks = Math.floor(diffDays / 7)
    const remainingDays = diffDays % 7
    
    if (weeks === 1 && remainingDays === 0) return '1 semana'
    if (weeks === 1) return `1 semana y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
    if (remainingDays === 0) return `${weeks} semanas`
    return `${weeks} semanas y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
  }

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

  if (assignments.length === 0) {
    return (
      <div className="p-12 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">No hay territorios completados aún</p>
        <p className="text-sm text-slate-400">
          El historial de territorios completados aparecerá aquí
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <div className="p-4 border-b border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por número o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="relative">
            <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos los tipos</option>
              <option value="CONDUCTOR">Conductor</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>

          {/* Filtro por año */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filtro por mes */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos los meses</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-center bg-slate-800/50 rounded-lg px-4 py-2">
            <span className="text-sm text-slate-300">
              <span className="font-bold text-green-400">{filteredAssignments.length}</span> de {assignments.length} registros
            </span>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(searchTerm || selectedYear !== 'all' || selectedMonth !== 'all' || selectedType !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedYear('all')
              setSelectedMonth('all')
              setSelectedType('all')
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <Table minWidth="1000px">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Territorio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Asignado a
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Finalización
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAssignments.map((assignment) => (
              <tr key={`${assignment.type}-${assignment.id}`} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Territorio {assignment.territoryNumber}
                      </p>
                      {assignment.territoryDescription && (
                        <p className="text-xs text-slate-400">
                          {assignment.territoryDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-white font-medium">
                      {assignment.assigneeName}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    assignment.type === 'CONDUCTOR'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {assignment.type === 'CONDUCTOR' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <UserCircle className="h-3 w-3" />
                    )}
                    {assignment.type === 'CONDUCTOR' ? 'Conductor' : 'Personal'}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-slate-300">
                    {assignment.groupName}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-300">
                      {assignment.assignedDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(assignment.assignedDate, {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {assignment.endDate ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm text-green-400 font-medium">
                          {assignment.endDate.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(assignment.endDate, {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-300 font-medium">
                      {calculateDuration(assignment.assignedDate, assignment.endDate)}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  {deleteConfirm === `${assignment.type}-${assignment.id}` ? (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        disabled={deleting}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id, assignment.type)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {deleting ? (
                          <span className="animate-pulse">Eliminando...</span>
                        ) : (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Confirmar
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(`${assignment.type}-${assignment.id}`)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredAssignments.length === 0 && (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">No se encontraron resultados con los filtros seleccionados</p>
          </div>
        )}
    </div>
  )
}
