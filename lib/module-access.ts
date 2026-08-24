import { prisma } from '@/lib/prisma'

export type ModuleCode = 'TERRITORIES' | 'VYMC'

/** Devuelve los módulos habilitados para el usuario.
 *  Bootstrap: si no tiene ninguno registrado, le habilita ambos. */
export async function getUserModules(userId: string): Promise<ModuleCode[]> {
  let rows = await prisma.userModuleAccess.findMany({
    where: { userId },
    select: { module: true },
  })

  if (rows.length === 0) {
    // Bootstrap: usuarios existentes acceden a ambos módulos por defecto
    await prisma.userModuleAccess.createMany({
      data: [
        { userId, module: 'TERRITORIES' },
        { userId, module: 'VYMC' },
      ],
      skipDuplicates: true,
    })
    rows = await prisma.userModuleAccess.findMany({
      where: { userId },
      select: { module: true },
    })
  }

  return rows.map((r) => r.module as ModuleCode)
}
