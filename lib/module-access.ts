import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export type ModuleCode = 'TERRITORIES' | 'VYMC'

export async function authorizeModuleRequest(module: ModuleCode) {
  const session = await getSession()
  if (!session?.isAuthenticated || !session.tenantId) {
    return {
      response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
    }
  }

  const userModules = await getUserModules(session.userId)
  if (!userModules.includes(module)) {
    return {
      response: NextResponse.json(
        { error: 'No tenés acceso a este módulo' },
        { status: 403 }
      ),
    }
  }

  return { tenantId: session.tenantId }
}

/** Devuelve los módulos habilitados; las cuentas sin configuración conservan el acceso legado a ambos. */
export async function getUserModules(userId: string): Promise<ModuleCode[]> {
  const rows = await prisma.userModuleAccess.findMany({
    where: { userId },
    select: { module: true },
  })

  if (rows.length === 0) {
    return ['TERRITORIES', 'VYMC']
  }

  return rows.map((r) => r.module as ModuleCode)
}
