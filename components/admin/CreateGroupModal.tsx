'use client'

import { useState } from 'react'
import { Plus, X, Loader2, Users } from 'lucide-react'
import { createGroup } from '@/server'
import { useRouter } from 'next/navigation'

export function CreateGroupModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [superintendent, setSuperintendent] = useState('')
  const [auxiliary, setAuxiliary] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await createGroup(
      name,
      superintendent || undefined,
      auxiliary || undefined
    )
    setIsLoading(false)

    if (result.success) {
      setIsOpen(false)
      setName('')
      setSuperintendent('')
      setAuxiliary('')
      router.refresh()
    } else {
      setError(result.message)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 font-medium"
      >          <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Nuevo Grupo</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isLoading && setIsOpen(false)}
          />

          <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Nuevo Grupo</h2>
              </div>
              <button
                onClick={() => !isLoading && setIsOpen(false)}
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                  placeholder="Nombre del superintendente"
                />
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                  placeholder="Nombre del auxiliar"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 disabled:from-slate-700 disabled:to-slate-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Crear</span>
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
