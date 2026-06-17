'use client'

import { useState, useEffect } from 'react'
import { Save, X, Loader2, Users } from 'lucide-react'
import { updateGroup } from '@/server'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
  superintendent?: string | null
  auxiliary?: string | null
}

interface EditGroupModalProps {
  group: Group
  isOpen: boolean
  onClose: () => void
}

export function EditGroupModal({ group, isOpen, onClose }: EditGroupModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(group.name)
  const [superintendent, setSuperintendent] = useState(group.superintendent || '')
  const [auxiliary, setAuxiliary] = useState(group.auxiliary || '')

  // Actualizar valores cuando cambia el grupo
  useEffect(() => {
    if (isOpen) {
      setName(group.name)
      setSuperintendent(group.superintendent || '')
      setAuxiliary(group.auxiliary || '')
      setError(null)
    }
  }, [group, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await updateGroup(
      group.id,
      name,
      superintendent || undefined,
      auxiliary || undefined
    )
    
    setIsLoading(false)

    if (result.success) {
      onClose()
      router.refresh()
    } else {
      setError(result.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-white">Editar Grupo</h2>
          </div>
          <button
            onClick={() => !isLoading && onClose()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Nombre del Grupo *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Ej: Grupo 1, Grupo Norte..."
            />
          </div>

          <div>
            <label
              htmlFor="superintendent"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Superintendente
            </label>
            <input
              type="text"
              id="superintendent"
              value={superintendent}
              onChange={(e) => setSuperintendent(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Nombre del superintendente"
            />
            <p className="text-xs text-slate-500 mt-1">
              Se creará automáticamente como conductor si no existe
            </p>
          </div>

          <div>
            <label
              htmlFor="auxiliary"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Auxiliar
            </label>
            <input
              type="text"
              id="auxiliary"
              value={auxiliary}
              onChange={(e) => setAuxiliary(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              placeholder="Nombre del auxiliar"
            />
            <p className="text-xs text-slate-500 mt-1">
              Se creará automáticamente como conductor si no existe
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:from-slate-700 disabled:to-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
