'use client'

import { useState, useEffect } from 'react'
import { updateUser } from '@/server/auth'
import { getCongregationsForSelect } from '@/server/congregations'
import { Loader2, Edit, User as UserIcon, Mail, X, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email: string
    name: string | null
    tenantId: string
  }
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email)
  const [selectedCongregation, setSelectedCongregation] = useState(user.tenantId)
  const [congregations, setCongregations] = useState<Array<{ id: string; name: string }>>([])
  const [updating, setUpdating] = useState(false)
  const [loadingCongregations, setLoadingCongregations] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCongregations()
      setName(user.name || '')
      setEmail(user.email)
      setSelectedCongregation(user.tenantId)
    }
  }, [isOpen, user])

  async function loadCongregations() {
    setLoadingCongregations(true)
    const result = await getCongregationsForSelect()
    if (result.success) {
      setCongregations(result.data)
    }
    setLoadingCongregations(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email || !selectedCongregation) return

    setUpdating(true)
    const result = await updateUser(user.id, {
      name: name || undefined,
      email,
      tenantId: selectedCongregation,
    })

    if (result.success) {
      toast.success(result.message)
      router.refresh()
      onClose()
    } else {
      toast.error(result.message || 'Error al actualizar usuario')
    }
    setUpdating(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !updating && onClose()}
      />
      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Editar Usuario
          </h3>
          <button
            onClick={onClose}
            disabled={updating}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Congregación <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                value={selectedCongregation}
                onChange={(e) => setSelectedCongregation(e.target.value)}
                required
                disabled={updating || loadingCongregations}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingCongregations && (
                  <option value="">Cargando...</option>
                )}
                {congregations.map((cong) => (
                  <option key={cong.id} value={cong.id}>
                    {cong.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                placeholder="Nombre del usuario"
                disabled={updating}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                placeholder="usuario@ejemplo.com"
                disabled={updating}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="flex-1 px-4 py-2.5 border border-slate-700 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updating || !email || !selectedCongregation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 text-sm disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Actualizar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
