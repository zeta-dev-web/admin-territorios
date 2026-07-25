'use client'

import { useState, useEffect } from 'react'
import { createUser } from '@/server'
import { getCongregationsForSelect } from '@/server/congregations'
import { Loader2, UserPlus, User as UserIcon, Mail, Lock, X, RefreshCw, Copy, Check, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&'
  let password = ''
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [selectedCongregation, setSelectedCongregation] = useState('')
  const [congregations, setCongregations] = useState<Array<{ id: string; name: string }>>([])
  const [creating, setCreating] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [loadingCongregations, setLoadingCongregations] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCongregations()
    }
  }, [isOpen])

  async function loadCongregations() {
    setLoadingCongregations(true)
    const result = await getCongregationsForSelect()
    if (result.success) {
      setCongregations(result.data)
    }
    setLoadingCongregations(false)
  }

  function handleGeneratePassword() {
    const pw = generateSecurePassword()
    setNewPassword(pw)
    setPasswordCopied(false)
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(newPassword)
    setPasswordCopied(true)
    setTimeout(() => setPasswordCopied(false), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail || !newPassword || !selectedCongregation) return

    setCreating(true)
    const result = await createUser({
      email: newEmail,
      password: newPassword,
      name: newName || undefined,
      tenantId: selectedCongregation,
    })

    if (result.success) {
      toast.success(result.message || 'Usuario creado')
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      setSelectedCongregation('')
      router.refresh()
      onClose()
    } else {
      toast.error(result.message || 'Error al crear usuario')
    }
    setCreating(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !creating && onClose()}
      />
      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            Crear Nuevo Usuario
          </h3>
          <button
            onClick={onClose}
            disabled={creating}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
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
                disabled={creating || loadingCongregations}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingCongregations ? 'Cargando...' : congregations.length === 0 ? 'No hay congregaciones disponibles' : 'Seleccionar congregación'}
                </option>
                {congregations.map((cong) => (
                  <option key={cong.id} value={cong.id}>
                    {cong.name}
                  </option>
                ))}
              </select>
            </div>
            {congregations.length === 0 && !loadingCongregations && (
              <p className="mt-1.5 text-xs text-amber-400">
                ⚠️ Debes crear una congregación primero desde el menú "Congregaciones"
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                placeholder="Nombre del usuario"
                disabled={creating}
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
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                placeholder="usuario@ejemplo.com"
                disabled={creating}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                  placeholder="Mínimo 6 caracteres"
                  disabled={creating}
                />
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={creating}
                className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-all text-sm flex items-center gap-1.5 disabled:opacity-50"
                title="Generar contraseña segura"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Generar</span>
              </button>
              {newPassword && (
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-green-400 hover:border-green-500/50 transition-all text-sm flex items-center gap-1.5"
                  title="Copiar contraseña"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 px-4 py-2.5 border border-slate-700 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !newEmail || !newPassword || !selectedCongregation || congregations.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 text-sm disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Crear Usuario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
