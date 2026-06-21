'use client'

import { useState } from 'react'
import { Plus, Map, Users, Trash2 } from 'lucide-react'
import { FlipCard } from '@/components/maps/FlipCard'
import { UploadMapModal } from './UploadMapModal'
import { deleteMap } from '@/server'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
  const [selectedGroupForModal, setSelectedGroupForModal] = useState<string | null>(null)

  const generalMap = initialMaps.find(m => m.type === 'GENERAL')
  const groupMaps = initialMaps.filter(m => m.type === 'GROUP')

  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('¿Eliminar este mapa?')) return
    const result = await deleteMap(mapId)
    if (result.success) {
      toast.success(result.message)
      router.refresh()
    } else {
      toast.error(result.message)
    }
  }

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
            <div className="relative max-w-4xl mx-auto">
              <button
                onClick={() => handleDeleteMap(generalMap.id)}
                className="absolute top-2 right-2 z-10 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                title="Eliminar mapa"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
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
        <div className="space-y-6">
          {groups.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No hay grupos</h3>
              <p className="text-slate-500 text-sm">Creá grupos primero para asignarles mapas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groups.map((group) => {
                const groupMap = groupMaps.find(m => m.groupId === group.id)
                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        {group.name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedGroupForModal(group.id)
                            setShowModal(true)
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title={groupMap ? 'Cambiar mapa' : 'Agregar mapa'}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {groupMap && (
                          <button
                            onClick={() => handleDeleteMap(groupMap.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar mapa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {groupMap ? (
                      <FlipCard
                        images={groupMap.images.map(i => i.url)}
                        title={`Mapa - ${group.name}`}
                      />
                    ) : (
                      <div className="aspect-video bg-slate-800/50 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                        <Map className="h-8 w-8 mb-2" />
                        <p className="text-sm">Sin mapa asignado</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <UploadMapModal
          type={selectedTab}
          groupId={selectedTab === 'GROUP' && selectedGroupForModal ? selectedGroupForModal : undefined}
          groupName={selectedTab === 'GROUP' && selectedGroupForModal ? groups.find(g => g.id === selectedGroupForModal)?.name : undefined}
          onClose={() => {
            setShowModal(false)
            setSelectedGroupForModal(null)
          }}
        />
      )}
    </div>
  )
}
