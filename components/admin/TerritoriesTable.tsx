'use client'

import { useState } from 'react'
import { MapPin, Package, Edit, Trash2, User, Clock, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Table } from '@/components/common/Table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { deleteTerritory } from '@/server'

interface Territory {
  id: string
  number: number
  description: string | null
  groupId: string
  blocks: Array<{ letter: string }>
  assignments: Array<{
    startDate: Date
    isCompleted: boolean
    driver: {
      name: string
      group: {
        name: string
      }
    }
  }>
  personalAssignments: Array<{
    member: {
      name: string
      group: {
        name: string
      }
    }
  }>
  _count: {
    assignments: number
    personalAssignments: number
  }
  lastAssignmentDate?: Date | null
}

interface TerritoriesTableProps {
  territories: Territory[]
  onEdit?: (territory: Territory) => void
}

export function TerritoriesTable({ territories, onEdit }: TerritoriesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; number: number } | null>(null)

  const handleDelete = async () => {
    if (!confirmDelete) return

    setDeletingId(confirmDelete.id)
    setConfirmDelete(null)
    try {
      const result = await deleteTerritory(confirmDelete.id)
      if (result.success) {
        toast.success('Territorio eliminado correctamente')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al eliminar territorio')
    } finally {
      setDeletingId(null)
    }
  }
  if (territories.length === 0) {
    return (
      <div className="p-12 text-center">
        <MapPin className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">No hay territorios registrados</p>
        <p className="text-sm text-slate-400">
          Comienza creando tu primer territorio
        </p>
      </div>
    )
  }

  return (
    <>
      <Table minWidth="800px">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Territorio
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Manzanas
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Asignado A
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Última Asignación
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {territories.map((territory) => {
            const activeAssignment = territory.assignments[0] // Asignación activa de conductor
            const personalAssignment = territory.personalAssignments[0]
            const blockLetters = territory.blocks
              .map(b => b.letter)
              .sort()
              .join(', ')

            return (
              <tr
                key={territory.id}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-red-500">
                        {territory.number}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Territorio {territory.number}
                      </p>
                      {territory.description && (
                        <p className="text-xs text-slate-500">{territory.description}</p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-white">
                      {territory.blocks.length}
                    </span>
                    {territory.blocks.length > 0 && blockLetters.length < 30 && (
                      <span className="text-xs text-slate-400">
                        ({blockLetters})
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  {personalAssignment ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                      <User className="h-3 w-3" />
                      Personal
                    </span>
                  ) : activeAssignment ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                      <Clock className="h-3 w-3" />
                      Conductor
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-700/50 text-slate-400 rounded-full text-xs font-medium">
                      Disponible
                    </span>
                  )}
                </td>

                <td className="px-6 py-4">
                  {personalAssignment ? (
                    <div className="text-sm">
                      <p className="font-medium text-white">
                        {personalAssignment.member.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {personalAssignment.member.group.name}
                      </p>
                    </div>
                  ) : activeAssignment ? (
                    <div className="text-sm">
                      <p className="font-medium text-white">
                        {activeAssignment.driver.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        Desde {new Date(activeAssignment.startDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500">Sin asignaciones</span>
                  )}
                </td>

                {/* Última Asignación */}
                <td className="px-6 py-4">
                  {!personalAssignment && !activeAssignment ? (
                    territory.lastAssignmentDate ? (
                      <div className="text-sm">
                        <span className="text-slate-300">
                          {new Date(territory.lastAssignmentDate).toLocaleDateString('es-ES')}
                        </span>
                        {(() => {
                          const days = Math.ceil(
                            (new Date().getTime() - new Date(territory.lastAssignmentDate!).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                          return days > 180 ? (
                            <div className="flex items-center gap-1 text-orange-500 text-xs mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>+6 meses ({days} días)</span>
                            </div>
                          ) : null
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Sin historial</span>
                      </div>
                    )
                  ) : (
                    <span className="text-sm text-slate-500">Activa</span>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(territory)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                        title="Editar territorio"
                      >
                        <Edit className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete({ id: territory.id, number: territory.number })}
                      disabled={deletingId === territory.id}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar territorio"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Territorio"
        message={`¿Estás seguro de eliminar el Territorio ${confirmDelete?.number}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        isLoading={!!deletingId}
      />
    </>
  )
}
