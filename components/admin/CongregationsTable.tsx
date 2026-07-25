'use client'

import { Home, Users, MapPin, Trash2, Edit } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { deleteCongregation } from '@/server/congregations'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Table } from '@/components/common/Table'
import { CongregationModal } from './CongregationModal'

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

interface CongregationsTableProps {
  congregations: Congregation[]
}

export function CongregationsTable({ congregations }: CongregationsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCongregation, setEditingCongregation] = useState<Congregation | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  const handleDelete = async () => {
    if (!confirmDelete) return

    setDeletingId(confirmDelete.id)
    setConfirmDelete(null)
    
    try {
      const result = await deleteCongregation(confirmDelete.id)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al eliminar congregación')
    } finally {
      setDeletingId(null)
    }
  }

  if (congregations.length === 0) {
    return (
      <div className="p-12 text-center">
        <Home className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">No hay congregaciones registradas</p>
        <p className="text-sm text-slate-400">
          Crea la primera congregación para comenzar
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
              Congregación
            </th>
            <th className="text-center p-4 text-sm font-semibold text-slate-300">
              Usuarios
            </th>
            <th className="text-center p-4 text-sm font-semibold text-slate-300">
              Grupos
            </th>
            <th className="text-center p-4 text-sm font-semibold text-slate-300">
              Territorios
            </th>
            <th className="text-left p-4 text-sm font-semibold text-slate-300">
              Fecha de Creación
            </th>
            <th className="text-center p-4 text-sm font-semibold text-slate-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {congregations.map((congregation) => (
            <tr
              key={congregation.id}
              className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
            >
              {/* Nombre */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Home className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{congregation.name}</p>
                    <p className="text-xs text-slate-400">ID: {congregation.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </td>

              {/* Usuarios */}
              <td className="p-4 text-center">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-sm font-medium border border-blue-500/20">
                  <Users className="h-4 w-4" />
                  <span>{congregation._count.users}</span>
                </div>
              </td>

              {/* Grupos */}
              <td className="p-4 text-center">
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-1 rounded text-sm font-medium">
                  {congregation._count.groups}
                </span>
              </td>

              {/* Territorios */}
              <td className="p-4 text-center">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-sm font-medium border border-red-500/20">
                  <MapPin className="h-4 w-4" />
                  <span>{congregation._count.territories}</span>
                </div>
              </td>

              {/* Fecha */}
              <td className="p-4">
                <span className="text-sm text-slate-400">
                  {new Date(congregation.createdAt).toLocaleDateString('es-AR')}
                </span>
              </td>

              {/* Acciones */}
              <td className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setEditingCongregation(congregation)}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Editar congregación"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ id: congregation.id, name: congregation.name })}
                    disabled={deletingId === congregation.id || congregation._count.users > 0}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={congregation._count.users > 0 ? 'No se puede eliminar con usuarios asignados' : 'Eliminar congregación'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Congregación"
        message={`¿Estás seguro de eliminar la congregación "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        isLoading={!!deletingId}
      />

      {/* Modal de edición */}
      {editingCongregation && (
        <CongregationModal
          congregation={editingCongregation}
          isOpen={true}
          onClose={() => {
            setEditingCongregation(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
