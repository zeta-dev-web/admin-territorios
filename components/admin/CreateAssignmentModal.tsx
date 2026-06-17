'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, MapPin, UserCircle } from 'lucide-react'
import { createAssignment, getAllDrivers, getAllTerritories } from '@/server'
import { useRouter } from 'next/navigation'

interface Driver {
  id: string
  name: string
  group: {
    name: string
  }
}

interface Territory {
  id: string
  number: number
  description: string | null
  blocks?: Array<{ letter: string }>
}

export function CreateAssignmentModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      Promise.all([getAllDrivers(), getAllTerritories()]).then(
        ([driversResult, territoriesResult]) => {
          if (driversResult.success) {
            setDrivers(driversResult.data)
          }
          if (territoriesResult.success) {
            setTerritories(territoriesResult.data)
          }
          setIsLoading(false)
        }
      )
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedTerritoryId) {
      setError('Selecciona un territorio')
      return
    }

    if (!selectedDriverId) {
      setError('Selecciona un conductor')
      return
    }

    setIsLoading(true)
    setError(null)

    // Obtener el territorio seleccionado para sus bloques
    const selectedTerritory = territories.find(t => t.id === selectedTerritoryId)
    const blockLetters = selectedTerritory?.blocks?.map(b => b.letter) || []

    const result = await createAssignment({
      territoryId: selectedTerritoryId,
      driverId: selectedDriverId,
      blockLetters,
    })

    setIsLoading(false)

    if (result.success) {
      setIsOpen(false)
      setSelectedDriverId('')
      setSelectedTerritoryId('')
      router.refresh()
    } else {
      setError(result.message)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 font-medium"
      >          <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Nueva Asignación</span>
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
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Nueva Asignación de Conductor
                  </h2>
                  <p className="text-sm text-slate-400">
                    Asignar territorio a conductor
                  </p>
                </div>
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

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-400">
                  ℹ️ Las asignaciones de conductores normalmente se completan en 2
                  semanas. Para territorios más largos (hasta 4 meses), usa
                  Asignaciones Personales.
                </p>
              </div>

              {/* Seleccionar Territorio */}
              <div>
                <label
                  htmlFor="territory"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Territorio *
                </label>
                <select
                  id="territory"
                  value={selectedTerritoryId}
                  onChange={(e) => setSelectedTerritoryId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">Selecciona un territorio</option>
                  {territories.map((territory) => (
                    <option key={territory.id} value={territory.id}>
                      Territorio {territory.number}
                      {territory.description ? ` - ${territory.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Conductor */}
              <div>
                <label
                  htmlFor="driver"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Conductor *
                </label>
                <select
                  id="driver"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">Selecciona un conductor</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.group.name}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:from-slate-700 disabled:to-slate-800"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Asignando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Asignar</span>
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
