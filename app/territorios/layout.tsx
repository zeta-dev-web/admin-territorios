import { TermsGuard } from '@/components/auth/TermsGuard'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUserModules } from '@/lib/module-access'
import { AppLayoutTerritorios } from '@/components/territorios/app-layout-territorios'

export default async function TerritoriosLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.isAuthenticated) redirect('/login')

  const modules = await getUserModules(session.userId)
  if (!modules.includes('TERRITORIES')) redirect('/inicio')

  return (
    <TermsGuard>
      <AppLayoutTerritorios>
        {children}
      </AppLayoutTerritorios>
    </TermsGuard>
  )
}
