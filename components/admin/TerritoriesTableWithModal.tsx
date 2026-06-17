'use client'

import { useState } from 'react'
import { TerritoriesTable } from './TerritoriesTable'
import { TerritoryModal } from './TerritoryModal'

interface Territory {
  id: string
  number: number
  description: string | null
  groupId: string
  blocks: Array<{ letter: string }>
  assignments: Array<{
    startDate: Date
    isCompleted: boolean
    driver: {
      name: string
      group: {
        name: string
      }
    }
  }>
  personalAssignments: Array<{
    member: {
      name: string
      group: {
        name: string
      }
    }
  }>
  _count: {
    assignments: number
    personalAssignments: number
  }
}

interface Group {
  id: string
  name: string
}

interface TerritoriesTableWithModalProps {
  territories: Territory[]
  groups: Group[]
}

export function TerritoriesTableWithModal({ territories, groups }: TerritoriesTableWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null)

  const handleEdit = (territory: Territory) => {
    setEditingTerritory(territory)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingTerritory(null)
  }

  return (
    <>
      <TerritoriesTable territories={territories} onEdit={handleEdit} />

      <TerritoryModal
        isOpen={isModalOpen}
        onClose={handleClose}
        territory={editingTerritory}
        groups={groups}
      />
    </>
  )
}
