import { getCurrentTenantId } from './tenant'

/**
 * Agrega tenantId al where de consultas Prisma.
 * 
 * Uso en server actions:
 * ```ts
 * const tenantId = await getCurrentTenantId()
 * const data = await prisma.assignment.findMany({
 *   where: tenantFilter(tenantId, { isCompleted: false })
 * })
 * ```
 */
export function tenantFilter(tenantId: string, where: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...where, tenantId }
}

/**
 * Para crear registros: agrega tenantId al data.
 */
export function tenantData(tenantId: string, data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, tenantId }
}
