'use client'

import { useState } from 'react'
import { X, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { createDailyRecord } from '@/server'
import { useRouter } from 'next/navigation'

interface Block {
  id: string
  letter: string
  isCompleted: boolean
  lastWorkedDate?: Date | null
}

interface QuickBlockRegistrationProps {
  assignmentId: string
  driverId: string
  territoryNumber: number
  driverName: string
  blocks: Block[]
  onClose: () => void
}

export function QuickBlockRegistration({
  assignmentId,
  driverId,
  territoryNumber,
  driverName,
  blocks,
  onClose,
}: QuickBlockRegistrationProps) {
  const router = useRouter()
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedBlocks = [...blocks].sort((a, b) => a.letter.localeCompare(b.letter))
  const pendingBlocks = sortedBlocks.filter((b) => !b.isCompleted)

  const toggleBlock = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId]
    )
  }

  const handleSubmit = async () => {
    if (selectedBlocks.length === 0) {
      alert('Selecciona al menos una manzana')
      return
    }

    setIsSubmitting(true)

    try {
      // Registrar cada manzana seleccionada
      const results = await Promise.all(
        selectedBlocks.map((blockId) =>
          createDailyRecord({
            assignmentId,
            driverId,
            blockId,
            date: new Date(date),
            notes: notes || undefined,
          })
        )
      )

      const allSuccess = results.every((r) => r.success)

      if (allSuccess) {
        alert(`✓ ${selectedBlocks.length} manzana(s) registradas correctamente`)
        router.refresh()
        onClose()
      } else {
        alert('Algunos registros fallaron. Revisa los detalles.')
      }
    } catch (error) {
      alert('Error al registrar las manzanas')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F1729] rounded-xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Registrar Manzanas</h2>
              <p className="text-blue-100 text-sm mt-1">
                Territorio {territoryNumber} - {driverName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-lg font-bold text-white">{blocks.length}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
              <p className="text-xs text-green-400">Completadas</p>
              <p className="text-lg font-bold text-green-500">
                {blocks.filter((b) => b.isCompleted).length}
              </p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 text-center border border-orange-500/30">
              <p className="text-xs text-orange-400">Pendientes</p>
              <p className="text-lg font-bold text-orange-500">
                {pendingBlocks.length}
              </p>
            </div>
          </div>

          {pendingBlocks.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-green-400 font-medium">
                ¡Todas las manzanas completadas!
              </p>
            </div>
          ) : (
            <>
              {/* Selector de manzanas */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Manzanas trabajadas hoy ({selectedBlocks.length} seleccionadas)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {pendingBlocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => toggleBlock(block.id)}
                      disabled={isSubmitting}
                      className={`relative flex flex-col items-center justify-center h-14 rounded-lg border-2 transition-all ${
                        selectedBlocks.includes(block.id)
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="absolute top-1 right-1">
                        {selectedBlocks.includes(block.id) ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-bold text-lg">{block.letter}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Fecha del trabajo
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
              </div>

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
                  disabled={isSubmitting}
                  placeholder="Observaciones sobre el trabajo realizado..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {pendingBlocks.length > 0 && (
          <div className="border-t border-slate-800 p-4 bg-slate-900/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedBlocks.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Registrar ({selectedBlocks.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
