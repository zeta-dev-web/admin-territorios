import { AsyncLocalStorage } from 'async_hooks'

export interface RequestContext {
  tenantId: string
}

export const requestContext = new AsyncLocalStorage<RequestContext>()

/**
 * Ejecuta una función dentro de un contexto de request con un tenantId específico.
 * Útil para el endpoint /api/agent donde no hay session cookie.
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return requestContext.run({ tenantId }, fn)
}
