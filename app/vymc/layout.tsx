import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VymcSessionProvider } from '@/lib/vymc-session'
import { CongregationProvider } from '@/contexts/congregation-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppLayout } from '@/components/common/AppLayout'

export default async function VymcLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.isAuthenticated) redirect('/login')

  const [tenant, user] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }),
  ])

  return (
    <VymcSessionProvider
      user={{
        name: user?.name ?? session.email,
        email: session.email,
        congregationId: session.tenantId,
        congregationName: tenant?.name ?? '',
      }}
    >
      <AppLayout title="Vida y Ministerio Cristiano">
        <div className="vymc-theme min-h-full">
          <TooltipProvider>
            <CongregationProvider>
              <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
                {children}
              </div>
            </CongregationProvider>
          </TooltipProvider>
        </div>
      </AppLayout>
    </VymcSessionProvider>
  )
}
