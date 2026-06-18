// Tipos para el Dashboard

export interface BlockStatus {
  id: string
  letter: string
  isCompleted: boolean
  lastWorkedDate?: Date | null
}

export interface TerritoryProgress {
  territoryId: string
  territoryNumber: number
  assignmentId: string
  driverName: string
  startDate: Date
  totalBlocks: number
  completedBlocks: number
  progressPercentage: number
  blocks: BlockStatus[]
}

export interface AtrasadoTerritory {
  territoryId: string
  territoryNumber: number
  lastAssignmentDate: Date | null
  daysSinceLastAssignment: number | null
  lastAssignmentType?: 'conductor' | 'personal' | null
}

export interface TerritoryFrequency {
  territoryId: string
  territoryNumber: number
  completedAssignments: number
}

export interface DashboardMetrics {
  activeTerritoriesProgress: TerritoryProgress[]
  atrasados: AtrasadoTerritory[]
  territoryFrequency: TerritoryFrequency[]
}

// Inputs para Server Actions

export interface CreateAssignmentInput {
  territoryId: string
  driverId: string
  blockLetters: string[]
  startDate?: Date
}

export interface CreateDailyRecordInput {
  assignmentId: string
  driverId: string
  blockId: string
  date: Date
  notes?: string
}
