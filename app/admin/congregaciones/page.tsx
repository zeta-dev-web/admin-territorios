import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/server/auth'
import { getAllCongregations } from '@/server/congregations'
import { CongregationsPageClient } from '@/components/admin/CongregationsPageClient'

export default async function CongregationsPage() {
  const role = await getCurrentUserRole()

  if (role !== 'ADMIN') {
    redirect('/territorios')
  }

  const result = await getAllCongregations()
  const congregations = result.success && result.data ? result.data : []

  return <CongregationsPageClient congregations={congregations} />
}
