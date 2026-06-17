'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, MapPin, Save } from 'lucide-react'
import { createTerritory, updateTerritory, getAllGroups } from '@/server'
import { useRouter } from 'next/navigation'

interface TerritoryModalProps {
  isOpen: boolean
  onClose: () => void
  territory?: {
    id: string
    number: number
    description: string | null
    groupId: string
    blocks: Array<{ letter: string }>
  } | null
  groups: Array<{ id: string; name: string }>
}

export function TerritoryModal({ isOpen, onClose, territory, groups }: TerritoryModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [number, setNumber] = useState('')
  const [description, setDescription] = useState('')
  const [groupId, setGroupId] = useState('')
  const [blocks, setBlocks] = useState('')

  const isEditMode = !!territory

  // Cargar datos al editar
  useEffect(() => {
    if (territory) {
      setNumber(territory.number.toString())
      setDescription(territory.description || '')
      setGroupId(territory.groupId)
      setBlocks(territory.blocks.map(b => b.letter).join(', '))
    } else {
      setNumber('')
      setDescription('')
      setGroupId(groups[0]?.id || '')
      setBlocks('')
    }
    setError(null)
  }, [territory, groups, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const blockLetters = blocks
      .split(',')
      .map(b => b.trim().toUpperCase())
      .filter(b => b.length > 0)

    let result

    if (isEditMode) {
      result = await updateTerritory(territory.id, {
        number: parseInt(number),
        description: description || undefined,
        groupId,
        blockLetters: blockLetters.length > 0 ? blockLetters : undefined,
      })
    } else {
      result = await createTerritory(
        parseInt(number),
        groupId,
        description || undefined,
        blockLetters.length > 0 ? blockLetters : undefined
      )
    }

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
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* Contenido del modal */}
      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEditMode ? 'Editar Territorio' : 'Nuevo Territorio'}
            </h2>
          </div>
          <button
            onClick={() => !isLoading && onClose()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Número */}
          <div>
            <label
              htmlFor="number"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Número del Territorio *
            </label>
            <input
              type="number"
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              min="1"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              placeholder="Ej: 1, 2, 3..."
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Descripción (Opcional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              placeholder="Ej: Zona centro, Barrio norte..."
            />
          </div>

          {/* Grupo */}
          <div>
            <label
              htmlFor="groupId"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Grupo *
            </label>
            <select
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
            >
              <option value="">Selecciona un grupo</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Manzanas */}
          <div>
            <label
              htmlFor="blocks"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Manzanas (Opcional)
            </label>
            <input
              type="text"
              id="blocks"
              value={blocks}
              onChange={(e) => setBlocks(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              placeholder="Ej: A, B, C, D (separadas por comas)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Ingresa las letras de las manzanas separadas por comas
            </p>
          </div>

          {/* Botones */}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20 disabled:from-slate-700 disabled:to-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isEditMode ? 'Guardando...' : 'Creando...'}</span>
                </>
              ) : (
                <>
                  {isEditMode ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  <span>{isEditMode ? 'Guardar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
