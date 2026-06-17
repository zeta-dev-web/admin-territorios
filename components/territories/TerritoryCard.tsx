'use client'

import { User, Calendar, TrendingUp } from 'lucide-react'
import { TerritoryProgress } from '@/types'
import { BlockGrid } from './BlockGrid'
import { formatDateShort } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TerritoryCardProps {
  territory: TerritoryProgress
}

export function TerritoryCard({ territory }: TerritoryCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/dashboard/${territory.territoryId}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#0F1729] rounded-xl border border-slate-800 shadow-sm hover:shadow-lg hover:border-red-500 transition-all cursor-pointer overflow-hidden"
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
    </div>
  )
}
