'use client'

import { X, CheckCircle2, Circle, MapPin } from 'lucide-react'
import type { BlockStatus } from '@/types'

interface ViewBlocksModalProps {
  territoryNumber: number
  assigneeName: string
  blocks: BlockStatus[]
  onClose: () => void
}

export function ViewBlocksModal({
  territoryNumber,
  assigneeName,
  blocks,
  onClose,
}: ViewBlocksModalProps) {
  const completedCount = blocks.filter((b) => b.isCompleted).length
  const totalCount = blocks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0F1729] border-b border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Territorio {territoryNumber}
                </h2>
                <p className="text-sm text-slate-400">
                  Conductor: {assigneeName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progreso</span>
              <span className="text-white font-semibold">
                {completedCount} / {totalCount} manzanas ({progress}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`relative aspect-square rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                  block.isCompleted
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                    : 'bg-slate-800 text-slate-400 border-2 border-slate-700'
                }`}
              >
                <div className="absolute top-1 right-1">
                  {block.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <span className="text-2xl">{block.letter}</span>
                {block.lastWorkedDate && (
                  <span className="absolute bottom-1 left-1 right-1 text-xs text-center truncate">
                    {new Date(block.lastWorkedDate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500 rounded" />
              <span className="text-sm text-slate-300">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-800 border-2 border-slate-700 rounded" />
              <span className="text-sm text-slate-300">Pendiente</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-[#0F1729] border-t border-slate-800 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
