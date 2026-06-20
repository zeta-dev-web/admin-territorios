'use client'

import { useState } from 'react'
import { User, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { TerritoryProgress } from '@/types'
import { BlockGrid } from './BlockGrid'
import { formatDateShort } from '@/lib/utils'

interface TerritoryCardProps {
  territories: TerritoryProgress[]
}

export function TerritoryCard({ territories }: TerritoryCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  if (territories.length === 0) return null

  const territory = territories[currentIndex]

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDirection('right')
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? territories.length - 1 : prev - 1))
      setDirection(null)
    }, 150)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDirection('left')
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === territories.length - 1 ? 0 : prev + 1))
      setDirection(null)
    }, 150)
  }

  return (
    <div className="relative">
      {/* Card con efecto 3D */}
      <div
        className={`bg-[#0F1729] rounded-xl border border-slate-800 shadow-sm overflow-hidden ${
          direction === 'left'
            ? 'animate-[flip-out-left_0.15s_ease-in]'
            : direction === 'right'
            ? 'animate-[flip-out-right_0.15s_ease-in]'
            : 'animate-[flip-in_0.15s_ease-out]'
        }`}
      >
        {/* Header del territorio */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Territorio {territory.territoryNumber}
              </h3>
              <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                <User className="h-4 w-4" />
                <span>{territory.driverName}</span>
              </div>
            </div>

            {/* Badge de progreso */}
            <div className="flex flex-col items-end">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                {territory.progressPercentage}%
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDateShort(territory.startDate)}</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Progreso</span>
              <span>
                {territory.completedBlocks} / {territory.totalBlocks} manzanas
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${territory.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Grid de manzanas */}
        <div className="p-4 bg-[#0A0F1C]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-white">Manzanas</span>
          </div>
          <BlockGrid blocks={territory.blocks} compact />
        </div>

        {/* Navegación y contador */}
        {territories.length > 1 && (
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-lg shadow-red-500/30 border-2 border-red-400 transition-all hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <span className="text-sm text-slate-400 font-medium">
              {currentIndex + 1} de {territories.length}
            </span>

            <button
              onClick={handleNext}
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-lg shadow-red-500/30 border-2 border-red-400 transition-all hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
