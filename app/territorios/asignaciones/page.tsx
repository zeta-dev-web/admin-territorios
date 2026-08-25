import { getAllUnifiedAssignmentsForAdmin } from '@/server'
import { AssignmentsPageClient } from '@/components/admin/AssignmentsPageClient'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const result = await getAllUnifiedAssignmentsForAdmin()
  const assignments = result.success ? result.data : []
  const total = result.success ? result.total : 0
  const conductorCount = result.success ? result.conductorCount : 0
  const personalCount = result.success ? result.personalCount : 0
  const uniqueTerritories = result.success ? result.uniqueTerritories : 0

  return (
    <div className="p-6 space-y-6">
      <AssignmentsPageClient
        assignments={assignments}
        total={total}
        conductorCount={conductorCount}
        personalCount={personalCount}
        uniqueTerritories={uniqueTerritories}
      />
    </div>
  )
}
