'use client'

import { useState } from 'react'
import { BlockStatus } from '@/types'
import { createDailyRecord } from '@/server'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface DailyRecordFormProps {
  assignmentId: string
  driverId: string
  blocks: BlockStatus[]
}

export function DailyRecordForm({
  assignmentId,
  driverId,
  blocks,
}: DailyRecordFormProps) {
  const router = useRouter()
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Filtrar solo bloques pendientes
  const pendingBlocks = blocks
    .filter((b) => !b.isCompleted)
    .sort((a, b) => a.letter.localeCompare(b.letter))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBlockId) {
      setMessage({ type: 'error', text: 'Selecciona una manzana' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await createDailyRecord({
        assignmentId,
        driverId,
        blockId: selectedBlockId,
        date: new Date(date),
        notes: notes || undefined,
      })

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setSelectedBlockId('')
        setNotes('')
        
        // Recargar la página después de un momento
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al registrar el trabajo',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (pendingBlocks.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <p className="text-green-400 font-medium">
          ¡Todas las manzanas completadas!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mensaje de estado */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Selector de manzana */}
      <div>
        <label
          htmlFor="block"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Manzana trabajada
        </label>
        <select
          id="block"
          value={selectedBlockId}
          onChange={(e) => setSelectedBlockId(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
        >
          <option value="">Selecciona una manzana</option>
          {pendingBlocks.map((block) => (
            <option key={block.id} value={block.id}>
              Manzana {block.letter}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de fecha */}
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
          required
          disabled={isSubmitting}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
        />
      </div>

      {/* Notas opcionales */}
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
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-slate-900 disabled:cursor-not-allowed resize-none"
        />
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Registrando...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" />
            <span>Registrar Trabajo</span>
          </>
        )}
      </button>
    </form>
  )
}
