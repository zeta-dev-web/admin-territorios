'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUsers, createUser, deleteUser, resetPassword } from '@/server'
import { Loader2, Trash2, UserPlus, Shield, User as UserIcon, Mail, Lock, X, RefreshCw, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Table } from '@/components/common/Table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
}

interface UsersClientProps {
  headerOnly?: boolean
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

export function UsersClient({ headerOnly }: UsersClientProps = {}) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetUserEmail, setResetUserEmail] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await getUsers()
    if (result.success) {
      setUsers(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!headerOnly) {
      loadUsers()
    }
  }, [loadUsers, headerOnly])

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
    if (!newEmail || !newPassword) return

    setCreating(true)
    const result = await createUser({
      email: newEmail,
      password: newPassword,
      name: newName || undefined,
    })

    if (result.success) {
      toast.success(result.message || 'Usuario creado')
      setShowCreate(false)
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      loadUsers()
    } else {
      toast.error(result.message || 'Error al crear usuario')
    }
    setCreating(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return

    const result = await deleteUser(confirmDelete.id)
    setConfirmDelete(null)
    if (result.success) {
      toast.success(result.message)
      loadUsers()
    } else {
      toast.error(result.message || 'Error al eliminar usuario')
    }
  }

  function openResetModal(userId: string, email: string) {
    setResetUserId(userId)
    setResetUserEmail(email)
    setShowResetModal(true)
  }

  async function handleResetPassword() {
    if (!resetUserId) return

    setResettingId(resetUserId)
    const result = await resetPassword(resetUserId)
    if (result.success) {
      toast.success(result.message)
      loadUsers()
      setShowResetModal(false)
      setResetUserId(null)
      setResetUserEmail('')
    } else {
      toast.error(result.message || 'Error al resetear contraseña')
    }
    setResettingId(null)
  }

  // Si es headerOnly, renderizar solo el header con el botón
  if (headerOnly) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Usuarios</h1>
            <p className="text-sm text-slate-400">
              Gestioná los usuarios del sistema
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Nuevo Usuario</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Modal crear usuario */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          />
          <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Crear Nuevo Usuario
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                      placeholder="Mínimo 6 caracteres"
                      disabled={creating}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={creating}
                    className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-blue-400 hover:border-blue-500/50 transition-all text-sm flex items-center gap-1.5 disabled:opacity-50"
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
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 border border-slate-700 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newEmail || !newPassword}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none"
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
      )}

      {/* Modal resetear contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !resettingId && setShowResetModal(false)}
          />
          <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Resetear Contraseña</h3>
              <button
                onClick={() => setShowResetModal(false)}
                disabled={!!resettingId}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <p className="text-sm text-slate-300 mb-1">Usuario</p>
                <p className="text-white font-medium">{resetUserEmail}</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                  Se va a generar una nueva contraseña segura y se le enviará un email al usuario con las nuevas credenciales.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={!!resettingId}
                  className="flex-1 px-4 py-2.5 border border-slate-700 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors text-sm disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={!!resettingId}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 text-sm disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none"
                >
                  {resettingId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Reseteando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Resetear Contraseña</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 py-16 text-center">
          <UserIcon className="h-16 w-16 mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 text-lg font-medium mb-1">No hay usuarios</p>
          <p className="text-slate-500 text-sm">Creá el primer usuario para empezar</p>
        </div>
      ) : (
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 overflow-hidden">
          <Table minWidth="700px">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">
                          {user.name || user.email.split('@')[0]}
                        </span>
                        <p className="text-xs text-slate-500">
                          Creado {new Date(user.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {user.role === 'ADMIN' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <UserIcon className="h-3 w-3" />
                      )}
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {user.role !== 'ADMIN' && (
                        <>
                          <button
                            onClick={() => openResetModal(user.id, user.email)}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Resetear contraseña"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ id: user.id, email: user.email })}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar al usuario "${confirmDelete?.email}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
