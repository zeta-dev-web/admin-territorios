'use client'

import { useState } from 'react'
import { Shield, UserPlus } from 'lucide-react'
import { UsersTable } from './UsersTable'
import { CreateUserModal } from './CreateUserModal'

export function UsersPageClient() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
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

      {/* Tabla */}
      <UsersTable />

      {/* Modal crear */}
      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  )
}
