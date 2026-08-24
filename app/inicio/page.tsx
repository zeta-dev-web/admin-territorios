import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserModules } from '@/lib/module-access'
import { SITE_MESSAGES } from '@/lib/site-messages'
import { prisma } from '@/lib/prisma'
import { InicioDashboard } from '@/components/inicio/inicio-dashboard'

export const dynamic = 'force-dynamic'

export default async function InicioPage() {
  const session = await getSession()
  if (!session?.isAuthenticated) redirect('/login')

  const modules = await getUserModules(session.userId)
  if (modules.length === 0) redirect('/login')

  const [user, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    }),
    prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    }),
  ])

  const messages = SITE_MESSAGES.filter(
    (message) =>
      message.active &&
      (!message.modules ||
        message.modules.some((module) => modules.includes(module)))
  )

  return (
    <InicioDashboard
      userName={user?.name ?? session.email}
      congregationName={tenant?.name ?? ''}
      modules={modules}
      messages={messages}
    />
  )
}
