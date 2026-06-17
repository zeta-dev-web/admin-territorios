'use client'

import { Users, UserCircle, Edit, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { AddMemberModal } from './AddMemberModal'
import { MembersList } from './MembersList'
import { EditGroupModal } from './EditGroupModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Table } from '@/components/common/Table'
import { deleteGroup } from '@/server'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Member {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  superintendent?: string | null
  auxiliary?: string | null
  drivers: Array<{
    name: string
  }>
  members: Member[]
}

interface GroupsTableProps {
  groups: Group[]
}

export function GroupsTable({ groups }: GroupsTableProps) {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  async function confirmDelete() {
    if (!deletingGroup) return

    setIsDeleting(true)
    const result = await deleteGroup(deletingGroup.id)
    setIsDeleting(false)

    if (result.success) {
      setDeletingGroup(null)
      router.refresh()
    } else {
      alert(result.message)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="p-12 text-center">
        <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">No hay grupos registrados</p>
        <p className="text-sm text-slate-400">
          Comienza creando tu primer grupo
        </p>
      </div>
    )
  }

  return (
    <>
      <Table minWidth="900px">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Superintendente
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Auxiliar
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <span className="hidden md:inline">Conductores</span>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Integrantes
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.id)
              
              return (
                <>
                  <tr key={group.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{group.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-white">
                        {group.superintendent || <span className="text-slate-500">No asignado</span>}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-white">
                        {group.auxiliary || <span className="text-slate-500">No asignado</span>}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="hidden md:inline">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-white">
                            {group.drivers.length}
                          </span>
                          {group.drivers.length > 0 && (
                            <span className="text-xs text-slate-400">
                              ({group.drivers.slice(0, 2).map(d => d.name).join(', ')}
                              {group.drivers.length > 2 && `, +${group.drivers.length - 2}`})
                            </span>
                          )}
                        </div>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-2 hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-white">
                          {group.members.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingGroup(group)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                          title="Editar grupo"
                        >
                          <Edit className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => setDeletingGroup(group)}
                          className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                          title="Eliminar grupo"
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${group.id}-members`}>
                      <td colSpan={6} className="px-6 py-4 bg-slate-900/50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white">
                              Integrantes del grupo
                            </h3>
                            <AddMemberModal groupId={group.id} groupName={group.name} />
                          </div>
                          <MembersList
                            members={group.members}
                            groupId={group.id}
                            driverNames={group.drivers.map(d => d.name)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
      </Table>

      {/* Modal de edición */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!deletingGroup}
        title="Eliminar Grupo"
        message={`¿Estás seguro de eliminar el grupo "${deletingGroup?.name}"? Esta acción no se puede deshacer. No se puede eliminar si tiene conductores o integrantes asignados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingGroup(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  )
}
