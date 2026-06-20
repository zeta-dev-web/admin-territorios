'use client'

import { useState } from 'react'
import { BarChart3, Trophy, ChevronLeft, ChevronRight } from 'lucide-react'
import { TerritoryFrequency } from '@/types'

interface TerritoryFrequencyListProps {
  frequencies: TerritoryFrequency[]
}

const ITEMS_PER_PAGE = 5

export function TerritoryFrequencyList({
  frequencies,
}: TerritoryFrequencyListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (frequencies.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay historial de trabajos</p>
      </div>
    )
  }

  const maxAssignments = Math.max(
    ...frequencies.map((f) => f.completedAssignments)
  )

  const totalPages = Math.ceil(frequencies.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentFrequencies = frequencies.slice(startIndex, endIndex)

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {currentFrequencies.map((frequency, pageIndex) => {
          const globalIndex = startIndex + pageIndex
          return (
            <div key={frequency.territoryId} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {globalIndex < 3 && (
                    <Trophy
                      className={`h-4 w-4 ${
                        globalIndex === 0
                          ? 'text-yellow-500'
                          : globalIndex === 1
                          ? 'text-gray-400'
                          : 'text-amber-600'
                      }`}
                    />
                  )}
                  <span className="font-medium text-white">
                    Territorio {frequency.territoryNumber}
                  </span>
                </div>
                <span className="text-sm font-semibold text-red-500">
                  {frequency.completedAssignments}{' '}
                  {frequency.completedAssignments === 1 ? 'vez' : 'veces'}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all shadow-lg"
                  style={{
                    width: `${
                      (frequency.completedAssignments / maxAssignments) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-sm text-slate-400">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
