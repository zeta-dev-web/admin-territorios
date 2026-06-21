import { AppLayout } from '@/components/common/AppLayout'
import { UsersPageClient } from './UsersPage'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  return (
    <AppLayout title="Usuarios">
      <UsersPageClient />
    </AppLayout>
  )
}
