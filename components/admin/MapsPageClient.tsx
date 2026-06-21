'use client'

import { useState } from 'react'
import { Plus, Map, Users } from 'lucide-react'
import { FlipCard } from '@/components/maps/FlipCard'
import { UploadMapModal } from './UploadMapModal'
import { useRouter } from 'next/navigation'

interface MapImage {
  id: string
  url: string
  order: number
}

interface TerritoryMap {
  id: string
  type: string
  groupId: string | null
  images: MapImage[]
}

interface Group {
  id: string
  name: string
}

interface MapsPageClientProps {
  initialMaps: TerritoryMap[]
  groups: Group[]
}

export function MapsPageClient({ initialMaps, groups }: MapsPageClientProps) {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'GENERAL' | 'GROUP'>('GENERAL')
  const [showModal, setShowModal] = useState(false)

  const generalMap = initialMaps.find(m => m.type === 'GENERAL')
  const groupMap = initialMaps.find(m => m.type === 'GROUP') // Solo un mapa tipo GROUP

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
        <div className="space-y-4">
          {generalMap ? (
            <div className="max-w-4xl mx-auto">
              <FlipCard
                images={generalMap.images.map(i => i.url)}
                title="Mapa General de Territorios"
              />
            </div>
          ) : (
            <div className="text-center py-16 max-w-4xl mx-auto">
              <Map className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">Sin mapa general</h3>
              <p className="text-slate-500 text-sm mb-6">
                Agregá un mapa general usando una URL externa (Google Drive, Dropbox, etc.)
              </p>
            </div>
          )}
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {generalMap ? 'Cambiar Mapa General' : 'Agregar Mapa General'}
            </button>
          </div>
        </div>
      )}

      {selectedTab === 'GROUP' && (
        <div className="space-y-4">
          {groupMap ? (
            <div className="max-w-4xl mx-auto">
              <FlipCard
                images={groupMap.images.map(i => i.url)}
                title="Mapa de Grupos"
              />
            </div>
          ) : (
            <div className="text-center py-16 max-w-4xl mx-auto">
              <Map className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">Sin mapa de grupos</h3>
              <p className="text-slate-500 text-sm mb-6">
                Agregá un mapa de grupos usando una URL externa (Google Drive, Dropbox, etc.)
              </p>
            </div>
          )}
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {groupMap ? 'Cambiar Mapa de Grupos' : 'Agregar Mapa de Grupos'}
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <UploadMapModal
          type={selectedTab}
          currentMap={selectedTab === 'GENERAL' ? generalMap : groupMap}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
