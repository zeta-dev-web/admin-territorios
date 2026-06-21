import { getSession } from './auth'
import { requestContext } from './request-context'

/**
 * Obtiene el tenantId del usuario autenticado desde la sesion.
 * Para calls via API (/api/agent), checkea primero el request context (AsyncLocalStorage).
 * Lanza error si no hay sesion ni contexto.
 */
export async function getCurrentTenantId(): Promise<string> {
  // 1. Request context (para /api/agent con tenantId explicito)
  const ctx = requestContext.getStore()
  if (ctx?.tenantId) return ctx.tenantId

  // 2. Session cookie (para calls desde el navegador)
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
