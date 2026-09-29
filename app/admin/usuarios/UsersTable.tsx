'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUsers, deleteUser, resetPassword, impersonateUser, updateUserModules } from '@/server'
import { Loader2, Trash2, Shield, User as UserIcon, RefreshCw, X, Edit, Home, KeyRound, MapPin, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import { Table } from '@/components/common/Table'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useRouter } from 'next/navigation'
import { EditUserModal } from './EditUserModal'
import type { ModuleCode } from '@/lib/module-access'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  tenantId: string
  createdAt: Date
  lastLoginAt: Date | null
  tenant: {
    name: string
  }
  modules: ModuleCode[]
  isCurrentUser: boolean
}

function formatLastLogin(value: Date | null): string {
  if (!value) return 'Nunca'
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  if (days < 30) return `hace ${days} días`
  return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const moduleOptions: Array<{ id: ModuleCode; label: string; icon: typeof MapPin }> = [
  { id: 'TERRITORIES', label: 'Territorios', icon: MapPin },
  { id: 'VYMC', label: 'VYMC', icon: CalendarDays },
]

export function UsersTable() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUserId, setResetUserId] = useState<string | null>(null)
  const [resetUserEmail, setResetUserEmail] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [savingModulesFor, setSavingModulesFor] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await getUsers()
    if (result.success) {
      setUsers(result.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let isActive = true
    getUsers()
      .then((result) => {
        if (!isActive) return
        if (result.success) setUsers(result.data)
        setLoading(false)
      })
      .catch(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  async function handleDelete() {
    if (!confirmDelete) return

    const result = await deleteUser(confirmDelete.id)
    setConfirmDelete(null)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
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
      router.refresh()
      loadUsers()
      setShowResetModal(false)
      setResetUserId(null)
      setResetUserEmail('')
    } else {
      toast.error(result.message || 'Error al resetear contraseña')
    }
    setResettingId(null)
  }

  async function handleModuleAccessChange(user: User, module: ModuleCode, enabled: boolean) {
    const nextModules = enabled
      ? [...user.modules, module]
      : user.modules.filter((currentModule) => currentModule !== module)

    if (nextModules.length === 0) {
      toast.error('Cada usuario debe tener al menos un módulo habilitado')
      return
    }

    setSavingModulesFor(user.id)
    try {
      const result = await updateUserModules(user.id, nextModules)
      if (!result.success) {
        toast.error(result.message || 'Error al actualizar los módulos')
        return
      }

      setUsers((currentUsers) => currentUsers.map((currentUser) =>
        currentUser.id === user.id
          ? { ...currentUser, modules: nextModules }
          : currentUser
      ))
      if (user.isCurrentUser) {
        window.dispatchEvent(new Event('module-access-updated'))
      }
      toast.success(result.message)
    } catch {
      toast.error('No se pudieron guardar los módulos. Intentá nuevamente.')
    } finally {
      setSavingModulesFor(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-[#0F1729] rounded-xl border border-slate-800 py-16 text-center">
        <UserIcon className="h-16 w-16 mx-auto mb-4 text-slate-700" />
        <p className="text-slate-400 text-lg font-medium mb-1">No hay usuarios</p>
        <p className="text-slate-500 text-sm">Creá el primer usuario para empezar</p>
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 overflow-hidden">
          <Table minWidth="640px">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider md:table-cell">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Módulos habilitados
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider md:table-cell">
                  Congregación
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider md:table-cell">
                  Rol
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider lg:table-cell">
                  Última conexión
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
                        {user.isCurrentUser && (
                          <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                            Tu cuenta
                          </span>
                        )}
                        <p className="text-[11px] leading-tight text-slate-500 md:hidden">
                          {user.email}
                        </p>
                        <p className="text-[11px] leading-tight text-slate-500 md:hidden">
                          {user.tenant?.name || 'Sin congregación'}
                        </p>
                        <p className="text-[11px] leading-tight text-slate-500">
                          Creado {new Date(user.createdAt).toLocaleDateString('es-AR')}
                        </p>
                        <p className="text-[11px] leading-tight text-slate-500 lg:hidden">
                          Últ. conexión: {formatLastLogin(user.lastLoginAt)}
                        </p>
                      </div>
                  </div>
                </td>
                <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-slate-400 md:table-cell">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {moduleOptions.map(({ id, label, icon: ModuleIcon }) => {
                      const enabled = user.modules.includes(id)
                      return (
                        <label
                          key={id}
                          className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                            enabled
                              ? id === 'TERRITORIES'
                                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                                : 'border-blue-500/30 bg-blue-500/10 text-blue-200'
                              : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                          } ${savingModulesFor === user.id ? 'cursor-wait opacity-60' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={savingModulesFor !== null || (enabled && user.modules.length === 1)}
                            onChange={(event) => handleModuleAccessChange(user, id, event.target.checked)}
                            aria-label={`${enabled ? 'Deshabilitar' : 'Habilitar'} ${label} para ${user.isCurrentUser ? 'tu cuenta' : user.email}`}
                            className={`h-4 w-4 rounded border-slate-600 bg-slate-900 focus:ring-2 focus:ring-offset-0 ${id === 'TERRITORIES' ? 'accent-red-400 focus:ring-red-400' : 'accent-blue-400 focus:ring-blue-400'}`}
                          />
                          <ModuleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {savingModulesFor === user.id && (
                    <p className="mt-1.5 text-[11px] text-slate-500" role="status">Guardando permisos...</p>
                  )}
                </td>
                <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Home className="h-4 w-4 text-purple-400" />
                    <span>{user.tenant?.name || 'Sin congregación'}</span>
                  </div>
                </td>
                <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
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
                <td className="hidden px-6 py-4 whitespace-nowrap lg:table-cell">
                  <span className={`text-sm ${user.lastLoginAt ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                    {formatLastLogin(user.lastLoginAt)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {user.role !== 'ADMIN' && (
                      <>
                        <button
                          onClick={async () => {
                            const loadingToast = toast.loading('Ingresando como ' + user.email + '...')
                            const res = await impersonateUser(user.id)
                            toast.dismiss(loadingToast)
                            if (res.success) {
                              toast.success(res.message || 'Listo')
                              router.push('/territorios')
                            } else {
                              toast.error(res.message || 'Error al ingresar')
                            }
                          }}
                          className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all hover:scale-110"
                          title="Ingresar como este usuario"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
      </div>

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

      {/* Modal de edición */}
      {editingUser && (
        <EditUserModal
          isOpen={true}
          user={editingUser}
          onClose={() => {
            setEditingUser(null)
            loadUsers()
          }}
        />
      )}
    </>
  )
}
