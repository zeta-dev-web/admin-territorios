import { NextRequest, NextResponse } from 'next/server'
import type {
  AssignmentBlockWorkInput,
  CreateAssignmentInput,
  CreateDailyRecordInput,
} from '@/types'
import * as server from '@/server'
import { withTenantContext } from '@/lib/request-context'
import { prisma } from '@/lib/prisma'

// ── Auth ──

async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; tenantId?: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { valid: false }
  const token = authHeader.slice(7)

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: token },
      select: { id: true, tenantId: true, isActive: true },
    })

    if (!apiKey || !apiKey.isActive) return { valid: false }

    // Actualizar último uso (fire & forget)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    return { valid: true, tenantId: apiKey.tenantId }
  } catch {
    return { valid: false }
  }
}

// ── Tipos ──

interface AgentRequest {
  action: string
  params?: Record<string, unknown>
  tenantId?: string
}

interface AgentResponse {
  success: boolean
  data?: unknown
  message?: string
  action: string
}

// ── Action Registry ──
// Mapea cada accion a la funcion del servidor, normalizando los parametros.

type ActionHandler = (params: Record<string, unknown>) => Promise<unknown>

function parseBlockWork(value: unknown): AssignmentBlockWorkInput[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Error('blockWork debe ser una lista')

  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Registro de manzana inválido')
    const work = item as Record<string, unknown>
    const letter = typeof work.letter === 'string' ? work.letter.trim() : ''
    const date = new Date(work.date as string)
    if (!letter || Number.isNaN(date.getTime())) throw new Error('Registro de manzana inválido')

    return {
      letter,
      date,
      notes: typeof work.notes === 'string' ? work.notes : undefined,
    }
  })
}

export const actions: Record<string, ActionHandler> = {
  // ═══════════════════════════════════════════
  //  ASIGNACIONES (Conductor)
  // ═══════════════════════════════════════════

  createAssignment: (p) =>
    server.createAssignment(p as unknown as CreateAssignmentInput),

  getActiveAssignments: () => server.getActiveAssignments(),

  getAssignmentById: (p) => server.getAssignmentById(p.assignmentId as string),

  completeAssignment: (p) => server.completeAssignment(p.assignmentId as string),

  returnAssignment: (p) =>
    server.returnAssignment(
      p.assignmentId as string,
      p.returnDate ? new Date(p.returnDate as string) : undefined,
    ),

  getCompletedAssignmentsHistory: () => server.getCompletedAssignmentsHistory(),

  deleteAssignment: (p) => server.deleteAssignment(p.assignmentId as string),

  updateAssignment: (p) =>
    server.updateAssignment(
      p.assignmentId as string,
      {
        ...(p.data as Record<string, unknown>),
        startDate: (p.data as Record<string, unknown>)?.startDate
          ? new Date((p.data as Record<string, unknown>).startDate as string)
          : undefined,
        endDate: (p.data as Record<string, unknown>)?.endDate
          ? new Date((p.data as Record<string, unknown>).endDate as string)
          : undefined,
      } as { driverId?: string; startDate?: Date; endDate?: Date },
    ),

  // ═══════════════════════════════════════════
  //  REGISTROS DIARIOS
  // ═══════════════════════════════════════════

  createDailyRecord: (p) =>
    server.createDailyRecord({
      ...(p as unknown as CreateDailyRecordInput),
      date: new Date(p.date as string),
    }),

  getDailyRecordsByAssignment: (p) =>
    server.getDailyRecordsByAssignment(p.assignmentId as string),

  getDailyRecordsByDriver: (p) =>
    server.getDailyRecordsByDriver(
      p.driverId as string,
      p.startDate ? new Date(p.startDate as string) : undefined,
      p.endDate ? new Date(p.endDate as string) : undefined,
    ),

  deleteDailyRecord: (p) => server.deleteDailyRecord(p.recordId as string),

  // ═══════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════

  getDashboardMetrics: () => server.getDashboardMetrics(),

  getTerritoryProgress: (p) =>
    server.getTerritoryProgress(p.territoryId as string),

  getAssignmentBlocks: (p) =>
    server.getAssignmentBlocks(p.assignmentId as string),

  getGeneralStats: () => server.getGeneralStats(),

  // ═══════════════════════════════════════════
  //  GRUPOS
  // ═══════════════════════════════════════════

  createGroup: (p) =>
    server.createGroup(
      p.name as string,
      p.superintendent as string | undefined,
      p.auxiliary as string | undefined,
    ),

  getAllGroups: () => server.getAllGroups(),

  updateGroup: (p) =>
    server.updateGroup(
      p.groupId as string,
      p.name as string,
      p.superintendent as string | undefined,
      p.auxiliary as string | undefined,
    ),

  deleteGroup: (p) => server.deleteGroup(p.groupId as string),

  // ═══════════════════════════════════════════
  //  INTEGRANTES
  // ═══════════════════════════════════════════

  createMember: (p) =>
    server.createMember(p.name as string, p.groupId as string),

  getMembersByGroup: (p) => server.getMembersByGroup(p.groupId as string),

  updateMember: (p) =>
    server.updateMember(
      p.memberId as string,
      p.name as string,
      p.groupId as string | undefined,
    ),

  deleteMember: (p) => server.deleteMember(p.memberId as string),

  toggleMemberDriver: (p) =>
    server.toggleMemberDriver(
      p.memberId as string,
      p.groupId as string,
      p.memberName as string,
    ),

  getAllMembersForSelect: () => server.getAllMembersForSelect(),

  // ═══════════════════════════════════════════
  //  ASIGNACIONES PERSONALES
  // ═══════════════════════════════════════════

  createPersonalAssignment: (p) =>
    server.createPersonalAssignment(
      p.territoryId as string,
      p.memberId as string,
      p.notes as string | undefined,
      p.assignedDate ? new Date(p.assignedDate as string) : undefined,
    ),

  returnPersonalAssignment: (p) =>
    server.returnPersonalAssignment(
      p.assignmentId as string,
      p.returnDate ? new Date(p.returnDate as string) : undefined,
    ),

  getActivePersonalAssignments: () => server.getActivePersonalAssignments(),

  getPersonalAssignmentsByTerritory: (p) =>
    server.getPersonalAssignmentsByTerritory(p.territoryId as string),

  getPersonalAssignmentsByMember: (p) =>
    server.getPersonalAssignmentsByMember(p.memberId as string),

  deletePersonalAssignment: (p) =>
    server.deletePersonalAssignment(p.assignmentId as string),

  updatePersonalAssignment: (p) =>
    server.updatePersonalAssignment(
      p.assignmentId as string,
      {
        ...(p.data as Record<string, unknown>),
        assignedDate: (p.data as Record<string, unknown>)?.assignedDate
          ? new Date((p.data as Record<string, unknown>).assignedDate as string)
          : undefined,
        returnedDate: (p.data as Record<string, unknown>)?.returnedDate
          ? new Date((p.data as Record<string, unknown>).returnedDate as string)
          : undefined,
      } as { memberId?: string; assignedDate?: Date; returnedDate?: Date },
    ),

  // ═══════════════════════════════════════════
  //  ASIGNACIONES UNIFICADAS
  // ═══════════════════════════════════════════

  getUnifiedAssignments: (p) =>
    server.getUnifiedAssignments(
      (p.page as number) ?? 1,
      (p.pageSize as number) ?? 10,
    ),

  getAllUnifiedAssignmentsForAdmin: () =>
    server.getAllUnifiedAssignmentsForAdmin(),

  getUnifiedHistory: (p) =>
    server.getUnifiedHistory(
      (p.page as number) ?? 1,
      (p.pageSize as number) ?? 10,
    ),

  returnUnifiedAssignment: (p) =>
    server.returnUnifiedAssignment(
      p.assignmentId as string,
      p.type as 'CONDUCTOR' | 'PERSONAL',
      p.returnDate ? new Date(p.returnDate as string) : undefined,
    ),

  deleteHistoryRecord: (p) =>
    server.deleteHistoryRecord(p.assignmentId as string, p.type as 'CONDUCTOR' | 'PERSONAL'),

  deleteUnifiedAssignment: (p) =>
    server.deleteUnifiedAssignment(
      p.assignmentId as string,
      p.type as 'CONDUCTOR' | 'PERSONAL',
    ),

  updateUnifiedAssignment: (p) => {
    const data = (p.data as Record<string, unknown>) ?? {}
    return server.updateUnifiedAssignment(
      p.assignmentId as string,
      p.type as 'CONDUCTOR' | 'PERSONAL',
      {
        territoryId: data.territoryId as string | undefined,
        driverId: data.driverId as string | undefined,
        memberId: data.memberId as string | undefined,
        startDate: data.startDate ? new Date(data.startDate as string) : undefined,
        assignedDate: data.assignedDate ? new Date(data.assignedDate as string) : undefined,
        notes: data.notes as string | undefined,
        blockWork: parseBlockWork(data.blockWork),
      },
    )
  },

  // ═══════════════════════════════════════════
  //  CONDUCTORES
  // ═══════════════════════════════════════════

  createDriver: (p) =>
    server.createDriver(p as unknown as { name: string; groupId: string }),

  getAllDrivers: (p) =>
    server.getAllDrivers(
      (p.page as number) ?? 1,
      (p.pageSize as number) ?? 10,
    ),

  getDriversByGroup: (p) => server.getDriversByGroup(p.groupId as string),

  getDriverById: (p) => server.getDriverById(p.driverId as string),

  updateDriver: (p) =>
    server.updateDriver(
      p.driverId as string,
      p.name as string,
      p.groupId as string,
    ),

  deleteDriver: (p) => server.deleteDriver(p.driverId as string),

  getAllDriversForSelect: () => server.getAllDriversForSelect(),

  // ═══════════════════════════════════════════
  //  TERRITORIOS
  // ═══════════════════════════════════════════

  createTerritory: (p) =>
    server.createTerritory(
      p.number as number,
      p.groupId as string,
      p.description as string | undefined,
      p.blockLetters as string[] | undefined,
    ),

  getAllTerritories: (p) =>
    server.getAllTerritories(
      (p.page as number) ?? 1,
      (p.pageSize as number) ?? 10,
    ),

  getTerritoryById: (p) => server.getTerritoryById(p.territoryId as string),

  getTerritoryByNumber: (p) =>
    server.getTerritoryByNumber(p.number as number),

  updateTerritory: (p) =>
    server.updateTerritory(
      p.territoryId as string,
      p.data as { number?: number; description?: string; groupId?: string; blockLetters?: string[] },
    ),

  addBlocksToTerritory: (p) =>
    server.addBlocksToTerritory(
      p.territoryId as string,
      p.blockLetters as string[],
    ),

  deleteTerritory: (p) => server.deleteTerritory(p.territoryId as string),

  getAllTerritoriesForSelect: () => server.getAllTerritoriesForSelect(),

  getAllTerritoriesForAdmin: () => server.getAllTerritoriesForAdmin(),

  // ═══════════════════════════════════════════
  //  MAPAS
  // ═══════════════════════════════════════════

  createOrUpdateMap: (p) => {
    const images = (p.images as string[]) ||
      (p.frontImage ? [p.frontImage as string, p.backImage as string].filter(Boolean) : [])
    return server.createOrUpdateMap(
      p.type as 'GENERAL' | 'GROUP',
      images,
      p.groupId as string | undefined,
    )
  },

  getAllMaps: () => server.getAllMaps(),

  getMapByType: (p) =>
    server.getMapByType(
      p.type as 'GENERAL' | 'GROUP',
      p.groupId as string | undefined,
    ),

  deleteMap: (p) => server.deleteMap(p.mapId as string),

  // ═══════════════════════════════════════════
  //  EXPORTACION PDF (solo metadatos, no binario)
  // ═══════════════════════════════════════════

  getAvailableTerritoryRanges: () => server.getAvailableTerritoryRanges(),

  // ═══════════════════════════════════════════
  //  INTROSPECCION
  // ═══════════════════════════════════════════

  /**
   * Lista todas las acciones disponibles para que la IA descubra el catalogo.
   * Uso: { "action": "listActions" }
   */
  listActions: async () => Object.keys(actions).sort(),
}

// ── Utils ──

function success(action: string, data: unknown, message?: string): AgentResponse {
  return { success: true, data, message, action }
}

function error(action: string, message: string): AgentResponse {
  return { success: false, message, action }
}

// ── Handler ──

export async function POST(request: NextRequest) {
  // 1. Validar API key contra DB (obtiene tenantId automáticamente)
  const auth = await validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json(
      { success: false, message: 'API key inválida o no proporcionada' },
      { status: 401 },
    )
  }

  // 2. Parsear body
  let body: AgentRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Body inválido: se espera JSON' },
      { status: 400 },
    )
  }

  const { action, params = {}, tenantId } = body

  if (!action || typeof action !== 'string') {
    return NextResponse.json(
      { success: false, message: 'Campo "action" requerido (string)' },
      { status: 400 },
    )
  }

  // 3. Buscar la accion
  const handler = actions[action]
  if (!handler) {
    const available = Object.keys(actions).sort()
    return NextResponse.json(
      {
        success: false,
        message: `Acción "${action}" no encontrada`,
        availableActions: available,
      },
      { status: 404 },
    )
  }

  // 4. Determinar tenantId: primero del body, si no, del API key
  const targetTenantId = typeof tenantId === 'string' ? tenantId : auth.tenantId

  if (!targetTenantId) {
    return NextResponse.json(
      { success: false, message: 'No se pudo determinar el tenant. Revisá tu API key.' },
      { status: 400 },
    )
  }

  // 5. Ejecutar dentro del contexto del tenant
  const execute = () => handler(params)

  try {
    const result = await withTenantContext(targetTenantId, execute)

    // Si el resultado ya es un objeto con success/data (formato server action),
    // lo devolvemos directo para evitar doble anidamiento
    if (result && typeof result === 'object' && 'success' in (result as Record<string, unknown>)) {
      return NextResponse.json({ ...(result as Record<string, unknown>), action })
    }
    return NextResponse.json(success(action, result))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error(`[AGENT] Error en "${action}":`, err)
    return NextResponse.json(error(action, msg), { status: 500 })
  }
}
