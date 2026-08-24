import { getAllTerritoriesForAdmin, getAllGroups } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { TerritoriesPageClient } from '@/components/admin/TerritoriesPageClient'

export const dynamic = 'force-dynamic'

export default async function TerritoriesPage() {
  const [territoriesResult, groupsResult] = await Promise.all([
    getAllTerritoriesForAdmin(),
    getAllGroups(),
  ])

  const territories = territoriesResult.success ? territoriesResult.data : []
  const groups = groupsResult.success ? groupsResult.data : []
  const total = territoriesResult.success ? territoriesResult.total : 0
  const territoriesWithAssignments = territoriesResult.success ? territoriesResult.territoriesWithAssignments : 0
  const totalBlocks = territoriesResult.success ? territoriesResult.totalBlocks : 0

  return (
    <AppLayout title="Territorios">
      <div className="p-6 space-y-6">
        <TerritoriesPageClient
          territories={territories}
          groups={groups}
          total={total}
          territoriesWithAssignments={territoriesWithAssignments}
          totalBlocks={totalBlocks}
        />
      </div>
    </AppLayout>
  )
}
