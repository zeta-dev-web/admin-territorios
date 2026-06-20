'use client'

import { UserCircle, Users, MapPin, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { deleteDriver } from '@/server'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreateDriverModal } from './CreateDriverModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Table } from '@/components/common/Table'

interface Driver {
  id: string
  name: string
  groupId: string
  group: {
    name: string
  }
  assignments: Array<{
    id: string
    isCompleted: boolean
    territory: {
      number: number
    }
  }>
  _count: {
    assignments: number
    dailyRecords: number
  }
}

interface DriversTableProps {
  drivers: Driver[]
}

export function DriversTable({ drivers }: DriversTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = async () => {
    if (!confirmDelete) return

    setDeletingId(confirmDelete.id)
    setConfirmDelete(null)
    try {
      const result = await deleteDriver(confirmDelete.id)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al eliminar conductor')
    } finally {
      setDeletingId(null)
    }
  }

  if (drivers.length === 0) {
    return (
      <div className="p-12 text-center">
        <UserCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">No hay conductores</p>
        <p className="text-sm text-slate-400">
          Crea el primer conductor para comenzar
        </p>
      </div>
    )
  }

  return (
    <>
      <Table minWidth="800px">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-slate-300">
                Conductor
              </th>
              <th className="text-left p-4 text-sm font-semibold text-slate-300">
                Grupo
              </th>
              <th className="text-left p-4 text-sm font-semibold text-slate-300">
                Territorios Asignados
              </th>
              <th className="text-center p-4 text-sm font-semibold text-slate-300">
                Total Asignaciones
              </th>
              <th className="text-center p-4 text-sm font-semibold text-slate-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const activeAssignments = driver.assignments.filter(a => !a.isCompleted)
              
              return (
                <tr
                  key={driver.id}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Conductor */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{driver.name}</p>
                        <p className="text-xs text-slate-400">
                          {driver._count.dailyRecords} registros
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Grupo */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{driver.group.name}</span>
                    </div>
                  </td>

                  {/* Territorios Asignados */}
                  <td className="p-4">
                    {activeAssignments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/20"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>T-{assignment.territory.number}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Sin territorios</span>
                    )}
                  </td>

                  {/* Total Asignaciones */}
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-sm font-medium">
                      {driver._count.assignments}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar conductor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: driver.id, name: driver.name })}
                        disabled={deletingId === driver.id}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar conductor"
                      >
                        <Trash2 className="h-4 w-4" />
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
        title="Eliminar Conductor"
        message={`¿Estás seguro de eliminar al conductor "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        isLoading={!!deletingId}
      />

      {/* Modal de edición */}
      {editingDriver && (
        <CreateDriverModal
          driver={editingDriver}
          isOpen={true}
          onClose={() => {
            setEditingDriver(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
