import { getSession } from './auth'

/**
 * Obtiene el tenantId del usuario autenticado desde la sesion.
 * Lanza error si no hay sesion o no tiene tenant.
 */
export async function getCurrentTenantId(): Promise<string> {
  const session = await getSession()
  if (!session?.isAuthenticated) {
    throw new Error('No autenticado')
  }
  if (!session.tenantId) {
    throw new Error('El usuario no tiene un tenant asignado')
  }
  return session.tenantId
}

/**
 * Obtiene la sesion completa del usuario autenticado.
 * Retorna null si no hay sesion.
 */
export async function getCurrentSession() {
  const session = await getSession()
  if (!session?.isAuthenticated) return null
  return session
}
