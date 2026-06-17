'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { BlockStatus } from '@/types'
import { cn } from '@/lib/utils'

interface BlockGridProps {
  blocks: BlockStatus[]
  onBlockClick?: (block: BlockStatus) => void
  compact?: boolean
}

export function BlockGrid({
  blocks,
  onBlockClick,
  compact = false,
}: BlockGridProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.letter.localeCompare(b.letter))

  return (
    <div
      className={cn(
        'grid gap-2',
        compact
          ? 'grid-cols-6 sm:grid-cols-8'
          : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'
      )}
    >
      {sortedBlocks.map((block) => (
        <button
          key={block.id}
          onClick={() => onBlockClick?.(block)}
          disabled={!onBlockClick}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 transition-all',
            compact ? 'h-12 p-1' : 'h-16 p-2',
            block.isCompleted
              ? 'border-red-500 bg-red-500/10 text-red-500 shadow-lg shadow-red-500/20'
              : 'border-slate-800 bg-slate-800/50 text-slate-300',
            onBlockClick &&
              'hover:shadow-md hover:border-red-500 active:scale-95 cursor-pointer',
            !onBlockClick && 'cursor-default'
          )}
          aria-label={`Manzana ${block.letter} ${
            block.isCompleted ? 'completada' : 'pendiente'
          }`}
        >
          {/* Icono de estado */}
          <div className="absolute top-1 right-1">
            {block.isCompleted ? (
              <CheckCircle2 className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
            ) : (
              <Circle className={cn(compact ? 'h-3 w-3' : 'h-4 w-4', 'text-slate-500')} />
            )}
          </div>

          {/* Letra de la manzana */}
          <span
            className={cn(
              'font-bold',
              compact ? 'text-sm' : 'text-lg'
            )}
          >
            {block.letter}
          </span>

          {/* Fecha del último trabajo */}
          {!compact && block.lastWorkedDate && (
            <span className="text-xs text-slate-400 mt-1">
              {new Date(block.lastWorkedDate).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
              })}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
