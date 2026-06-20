'use client'

import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { AtrasadoTerritory } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface AtrasadosListProps {
  territories: AtrasadoTerritory[]
}

const ITEMS_PER_PAGE = 5

export function AtrasadosList({ territories }: AtrasadosListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (territories.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay territorios atrasados</p>
        <p className="text-xs text-slate-600 mt-1">
          Todos los territorios libres se han asignado en los últimos 6 meses
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(territories.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentTerritories = territories.slice(startIndex, endIndex)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {currentTerritories.map((territory) => (
          <div
            key={territory.territoryId}
            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800 hover:border-orange-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 rounded-full">
                <span className="font-bold text-orange-500">
                  {territory.territoryNumber}
                </span>
              </div>

              <div>
                <p className="font-medium text-white">
                  Territorio {territory.territoryNumber}
                </p>
                {territory.lastAssignmentDate ? (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Última: {formatDateShort(territory.lastAssignmentDate)}
                      {territory.lastAssignmentType && (
                        <span className="text-slate-500">
                          {' '}({territory.lastAssignmentType === 'conductor' ? 'conductor' : 'personal'})
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Nunca asignado</p>
                )}
              </div>
            </div>

            <div className="text-right">
              {territory.daysSinceLastAssignment !== null ? (
                <>
                  <p className="text-lg font-bold text-orange-500">
                    {territory.daysSinceLastAssignment}
                  </p>
                  <p className="text-xs text-slate-400">días</p>
                </>
              ) : (
                <div className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Sin historial</span>
                </div>
              )}
            </div>
          </div>
        ))}
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
