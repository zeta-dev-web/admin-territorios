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

export interface AssignmentBlockWorkInput {
  letter: string
  date: Date
  notes?: string
}

export interface UpdateAssignmentInput {
  territoryId?: string
  driverId?: string
  startDate?: Date
  endDate?: Date | null
  blockWork?: AssignmentBlockWorkInput[]
}

export interface CreateDailyRecordInput {
  assignmentId: string
  driverId: string
  blockId: string
  date: Date
  notes?: string
}

// Tipos para Exportación PDF

export interface TerritoryExportData {
  territoryId: string
  territoryNumber: number
  territoryDescription: string | null
  assignments: AssignmentExportRecord[]
}

export interface AssignmentExportRecord {
  id: string
  type: 'CONDUCTOR' | 'PERSONAL'
  assigneeName: string
  assignedDate: Date
  returnedDate: Date | null
  createdAt: Date
}

export interface TerritoryRange {
  start: number
  end: number
  label: string
  count: number
}

export interface PdfExportResult {
  success: boolean
  data?: Uint8Array
  filename?: string
  message?: string
}

