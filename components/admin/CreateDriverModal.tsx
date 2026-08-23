'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, UserCircle, Users, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createDriver, updateDriver, getAllGroups, getMembersByGroup } from '@/server'
import { useRouter } from 'next/navigation'

interface DriverData {
  id: string
  name: string
  groupId?: string | null
  group?: { name: string } | null
}

interface CreateDriverModalProps {
  driver?: DriverData | null
  isOpen?: boolean
  onClose?: () => void
}

export function CreateDriverModal({ driver, isOpen: controlledOpen, onClose }: CreateDriverModalProps) {
  const router = useRouter()
  const isEditMode = !!driver
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])
  const [useExistingMember, setUseExistingMember] = useState(false)
  const [name, setName] = useState(driver?.name || '')
  const [groupId, setGroupId] = useState(driver?.groupId || '')

  // Resetear estado cuando se abre
  useEffect(() => {
    if (isOpen) {
      setName(driver?.name || '')
      setGroupId(driver?.groupId || '')
      setUseExistingMember(false)
      getAllGroups().then((result) => {
        if (result.success) setGroups(result.data)
      })
    }
  }, [isOpen, driver])

  useEffect(() => {
    if (groupId && useExistingMember && !isEditMode) {
      getMembersByGroup(groupId).then((result) => {
        if (result.success) setMembers(result.data)
      })
    } else {
      setMembers([])
    }
  }, [groupId, useExistingMember, isEditMode])

  const handleMemberChange = (memberId: string) => {
    const selectedMember = members.find(m => m.id === memberId)
    if (selectedMember) {
      setName(selectedMember.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!groupId) {
      toast.error('Grupo es requerido')
      return
    }

    if (!name.trim()) {
      toast.error('Nombre es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      let result
      if (isEditMode && driver) {
        result = await updateDriver(driver.id, name.trim(), groupId)
      } else {
        result = await createDriver({ name: name.trim(), groupId })
      }

      if (result.success) {
        if (onClose) {
          onClose()
        } else {
          setInternalOpen(false)
        }
        setName('')
        setGroupId('')
        setUseExistingMember(false)
        router.refresh()
        toast.success(isEditMode ? 'Conductor actualizado correctamente' : 'Conductor creado correctamente')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al guardar conductor')
    } finally {
      setIsSubmitting(false)
    }
  }

  function open() { setInternalOpen(true) }
  function close() {
    if (onClose) { onClose() }
    else { setInternalOpen(false) }
  }

  return (
    <>
      {/* Botón (solo modo crear autónomo) */}
      {!controlledOpen && (
        <button
          onClick={open}
          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Nuevo Conductor</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1729] rounded-xl shadow-2xl w-full max-w-md border border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {isEditMode ? 'Editar Conductor' : 'Nuevo Conductor'}
                </h2>
              </div>
              <button
                onClick={close}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Grupo */}
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-slate-300 mb-2">
                  Grupo *
                </label>
                <select
                  id="groupId"
                  value={groupId}
                  onChange={(e) => { setGroupId(e.target.value); setUseExistingMember(false) }}
                  required
                  disabled={isSubmitting || isEditMode}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">Selecciona un grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle: Nuevo o existente (solo en creación) */}
              {groupId && !isEditMode && (
                <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="useExisting"
                    checked={useExistingMember}
                    onChange={(e) => setUseExistingMember(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="useExisting" className="text-sm text-slate-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Seleccionar de integrantes existentes
                  </label>
                </div>
              )}

              {/* Seleccionar integrante existente (solo en creación) */}
              {useExistingMember && groupId && !isEditMode && (
                <div>
                  <label htmlFor="memberId" className="block text-sm font-medium text-slate-300 mb-2">
                    Integrante *
                  </label>
                  <select
                    id="memberId"
                    onChange={(e) => handleMemberChange(e.target.value)}
                    required={useExistingMember}
                    disabled={isSubmitting || members.length === 0}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                  >
                    <option value="">
                      {members.length === 0 ? 'No hay integrantes en este grupo' : 'Selecciona un integrante'}
                    </option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nombre */}
              {(!useExistingMember || isEditMode) && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                  />
                </div>
              )}

              {/* Info de edición */}
              {isEditMode && driver && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-xs text-blue-400">
                    ℹ️ Si este conductor es superintendente o auxiliar del grupo, su nombre se actualizará también allí.
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={close}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 disabled:from-slate-700 disabled:to-slate-800 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isEditMode ? 'Guardando...' : 'Creando...'}</span>
                    </>
                  ) : (
                    <>
                      {isEditMode ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      <span>{isEditMode ? 'Guardar' : 'Crear'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
