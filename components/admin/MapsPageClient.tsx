'use client'

import { useState } from 'react'
import { Plus, Map, Users } from 'lucide-react'
import { FlipCard } from '@/components/maps/FlipCard'
import { UploadMapModal } from './UploadMapModal'

interface TerritoryMap {
  id: string
  type: string
  groupId: string | null
  frontImage: string
  backImage: string
}

interface Group {
  id: string
  name: string
}

interface MapsPageClientProps {
  initialMaps: TerritoryMap[]
  groups: Group[]
}

const STATIC_MAPS = {
  general: {
    front: '/mapas/GRAL01.jpg',
    back: '/mapas/GRAL02.png',
  },
  groups: {
    front: '/mapas/GRUPOS01.png',
    back: '/mapas/GRUPOS02.png',
  },
}

export function MapsPageClient({ initialMaps, groups }: MapsPageClientProps) {
  const [selectedTab, setSelectedTab] = useState<'GENERAL' | 'GROUP'>('GENERAL')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Map className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mapas de Territorios</h1>
            <p className="text-slate-400 text-sm">Visualiza los mapas generales y por grupo</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setSelectedTab('GENERAL')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            selectedTab === 'GENERAL'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>General</span>
          </div>
          {selectedTab === 'GENERAL' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
        <button
          onClick={() => setSelectedTab('GROUP')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            selectedTab === 'GROUP'
              ? 'text-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Por Grupo</span>
          </div>
          {selectedTab === 'GROUP' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {selectedTab === 'GENERAL' && (
        <div className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <FlipCard
              frontImage={STATIC_MAPS.general.front}
              backImage={STATIC_MAPS.general.back}
              title="Mapa General de Territorios"
            />
          </div>
        </div>
      )}

      {selectedTab === 'GROUP' && (
        <div className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <FlipCard
              frontImage={STATIC_MAPS.groups.front}
              backImage={STATIC_MAPS.groups.back}
              title="Mapas por Grupo"
            />
          </div>
        </div>
      )}
    </div>
  )
}
