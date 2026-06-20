'use client'

import { User, Trash2, Edit, UserCircle, Loader2 } from 'lucide-react'
import { deleteMember, toggleMemberDriver } from '@/server'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { EditMemberModal } from './EditMemberModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface Member {
  id: string
  name: string
}

interface MembersListProps {
  members: Member[]
  groupId: string
  driverNames?: string[]
}

export function MembersList({ members, groupId, driverNames = [] }: MembersListProps) {
  const router = useRouter()
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const isDriver = (memberName: string) =>
    driverNames.some((d) => d.toLowerCase() === memberName.toLowerCase())

  async function handleToggleDriver(member: Member) {
    setTogglingId(member.id)
    const result = await toggleMemberDriver(member.id, groupId, member.name)
    setTogglingId(null)

    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  async function confirmDelete() {
    if (!deletingMember) return

    setIsDeleting(true)
    const result = await deleteMember(deletingMember.id)
    setIsDeleting(false)

    if (result.success) {
      setDeletingMember(null)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No hay integrantes en este grupo
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => {
          const esConductor = isDriver(member.name)
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  esConductor ? 'bg-red-500/10' : 'bg-blue-500/10'
                }`}>
                  {esConductor ? (
                    <UserCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <User className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div>
                  <span className="text-white font-medium">{member.name}</span>
                  {esConductor && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs font-medium">
                      <UserCircle className="h-3 w-3" />
                      Conductor
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Conductor */}
                <button
                  onClick={() => handleToggleDriver(member)}
                  disabled={togglingId === member.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-medium border ${
                    esConductor
                      ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      : 'bg-slate-700/50 text-slate-400 border-slate-700 hover:bg-slate-700'
                  } disabled:opacity-50`}
                  title={esConductor ? 'Quitar como conductor' : 'Agregar como conductor'}
                >
                  {togglingId === member.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <UserCircle className="h-3 w-3" />
                  )}
                  <span>{esConductor ? 'Conductor' : 'Hacer conductor'}</span>
                </button>

                <button
                  onClick={() => setEditingMember(member)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                  title="Editar integrante"
                >
                  <Edit className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
                </button>
                <button
                  onClick={() => setDeletingMember(member)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors group"
                  title="Eliminar integrante"
                >
                  <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          currentGroupId={groupId}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingMember}
        title="Eliminar Integrante"
        message={`¿Estás seguro de eliminar a ${deletingMember?.name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMember(null)}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  )
}
