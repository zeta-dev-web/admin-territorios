'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Loader2, MapPin, Users } from 'lucide-react'
import { createPersonalAssignment, getAllGroups, getAllTerritories } from '@/server'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
  members: Member[]
}

interface Territory {
  id: string
  number: number
  description: string | null
}

export function CreatePersonalAssignmentModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      Promise.all([getAllGroups(), getAllTerritories()]).then(([groupsResult, territoriesResult]) => {
        if (groupsResult.success) {
          setGroups(groupsResult.data)
        }
        if (territoriesResult.success) {
          setTerritories(territoriesResult.data)
        }
        setIsLoading(false)
      })
    }
  }, [isOpen])

  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const availableMembers = selectedGroup?.members || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedTerritoryId) {
      setError('Selecciona un territorio')
      return
    }
    
    if (!selectedMemberId) {
      setError('Selecciona un integrante')
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await createPersonalAssignment(
      selectedTerritoryId,
      selectedMemberId,
      notes || undefined
    )
    
    setIsLoading(false)

    if (result.success) {
      setIsOpen(false)
      setSelectedGroupId('')
      setSelectedMemberId('')
      setSelectedTerritoryId('')
      setNotes('')
      router.refresh()
    } else {
      setError(result.message)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20 font-medium"
      >          <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Nueva Asignación Personal</span>
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
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Nueva Asignación Personal</h2>
                  <p className="text-sm text-slate-400">Asignar territorio a integrante</p>
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
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

              {/* Seleccionar Grupo */}
              <div>
                <label
                  htmlFor="group"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Grupo *
                </label>
                <select
                  id="group"
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value)
                    setSelectedMemberId('')
                  }}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                >
                  <option value="">Selecciona un grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length} integrantes)
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleccionar Integrante */}
              {selectedGroupId && (
                <div>
                  <label
                    htmlFor="member"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Integrante *
                  </label>
                  <select
                    id="member"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    required
                    disabled={isLoading || availableMembers.length === 0}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
                  >
                    <option value="">
                      {availableMembers.length === 0
                        ? 'No hay integrantes en este grupo'
                        : 'Selecciona un integrante'}
                    </option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notas */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Notas (opcional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 resize-none"
                  placeholder="Observaciones sobre esta asignación..."
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/20 disabled:from-slate-700 disabled:to-slate-800"
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
