'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Loader2, MapPin, Search, Check } from 'lucide-react'
import { createPersonalAssignment, getAllMembersForSelect, getAllTerritoriesForSelect } from '@/server'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  name: string
  group: { name: string } | null
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
  const [members, setMembers] = useState<Member[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('')
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [territorySearch, setTerritorySearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [showTerritoryDropdown, setShowTerritoryDropdown] = useState(false)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      Promise.all([getAllMembersForSelect(), getAllTerritoriesForSelect()]).then(
        ([membersResult, territoriesResult]) => {
          if (membersResult.success) {
            setMembers(membersResult.data)
          }
          if (territoriesResult.success) {
            setTerritories(territoriesResult.data)
          }
          setIsLoading(false)
        }
      )
    }
  }, [isOpen])

  const filteredTerritories = useMemo(() => {
    return territories.filter(t => 
      t.number.toString().includes(territorySearch) ||
      (t.description?.toLowerCase().includes(territorySearch.toLowerCase()))
    )
  }, [territories, territorySearch])

  const filteredMembers = useMemo(() => {
    return members.filter(m =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.group?.name ?? '').toLowerCase().includes(memberSearch.toLowerCase())
    )
  }, [members, memberSearch])

  const selectedTerritory = territories.find(t => t.id === selectedTerritoryId)
  const selectedMember = members.find(m => m.id === selectedMemberId)

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
      notes || undefined,
      new Date(assignedDate + 'T12:00:00')
    )
    
    setIsLoading(false)

    if (result.success) {
      setIsOpen(false)
      setSelectedMemberId('')
      setSelectedTerritoryId('')
      setTerritorySearch('')
      setMemberSearch('')
      setAssignedDate(new Date().toISOString().split('T')[0])
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
      >
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Nueva Asignación Personal</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isLoading && setIsOpen(false)}
          />

          <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Territorio *
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por número o descripción..."
                      value={territorySearch}
                      onChange={(e) => setTerritorySearch(e.target.value)}
                      onFocus={() => setShowTerritoryDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  {selectedTerritory && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-400">
                        Territorio {selectedTerritory.number}
                        {selectedTerritory.description && ` - ${selectedTerritory.description}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTerritoryId('')
                          setTerritorySearch('')
                        }}
                        className="ml-auto p-1 hover:bg-slate-800 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {showTerritoryDropdown && !selectedTerritory && filteredTerritories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                      {filteredTerritories.map((territory) => (
                        <button
                          key={territory.id}
                          type="button"
                          onClick={() => {
                            setSelectedTerritoryId(territory.id)
                            setTerritorySearch('')
                            setShowTerritoryDropdown(false)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors text-sm text-slate-200"
                        >
                          <span className="font-medium">Territorio {territory.number}</span>
                          {territory.description && (
                            <span className="text-slate-400"> - {territory.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Integrante *
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar integrante..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      onFocus={() => setShowMemberDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  {selectedMember && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-400">
                        {selectedMember.name}{selectedMember.group ? ` - ${selectedMember.group.name}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId('')
                          setMemberSearch('')
                        }}
                        className="ml-auto p-1 hover:bg-slate-800 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {showMemberDropdown && !selectedMember && filteredMembers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(member.id)
                            setMemberSearch('')
                            setShowMemberDropdown(false)
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors text-sm text-slate-200"
                        >
                          <span className="font-medium">{member.name}</span>
                          <span className="text-slate-400"> - {member.group?.name ?? ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de Asignación *
                </label>
                <input
                  type="date"
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

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
