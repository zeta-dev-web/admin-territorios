'use client'

import { BarChart3, Trophy } from 'lucide-react'
import { TerritoryFrequency } from '@/types'

interface TerritoryFrequencyListProps {
  frequencies: TerritoryFrequency[]
}

export function TerritoryFrequencyList({
  frequencies,
}: TerritoryFrequencyListProps) {
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

  return (
    <div className="space-y-3">
      {frequencies.slice(0, 10).map((frequency, index) => (
        <div key={frequency.territoryId} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {index < 3 && (
                <Trophy
                  className={`h-4 w-4 ${
                    index === 0
                      ? 'text-yellow-500'
                      : index === 1
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
      ))}
    </div>
  )
}
