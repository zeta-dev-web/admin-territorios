'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ClientPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ClientPagination({ page, totalPages, onPageChange }: ClientPaginationProps) {
  if (totalPages <= 1) return null

  const canGoPrevious = page > 1
  const canGoNext = page < totalPages

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
      <div className="text-sm text-slate-400">
        Página {page} de {totalPages}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
