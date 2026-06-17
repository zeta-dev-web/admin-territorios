import { getAllTerritories, getAllGroups } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { TerritoriesPageClient } from '@/components/admin/TerritoriesPageClient'

interface PageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function TerritoriesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const pageSize = Math.max(1, Math.min(50, Number(sp?.pageSize) || 10))

  const [territoriesResult, groupsResult] = await Promise.all([
    getAllTerritories(page, pageSize),
    getAllGroups(),
  ])

  const territories = territoriesResult.success ? territoriesResult.data : []
  const groups = groupsResult.success ? groupsResult.data : []
  const total = territoriesResult.success ? territoriesResult.total : 0
  const totalPages = territoriesResult.success ? territoriesResult.totalPages : 0
  const territoriesWithAssignments = territoriesResult.success ? (territoriesResult as any).territoriesWithAssignments ?? 0 : 0
  const totalBlocks = territoriesResult.success ? (territoriesResult as any).totalBlocks ?? 0 : 0

  return (
    <AppLayout title="Territorios">
      <div className="p-6 space-y-6">
        <TerritoriesPageClient
          territories={territories}
          groups={groups}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          territoriesWithAssignments={territoriesWithAssignments}
          totalBlocks={totalBlocks}
        />
      </div>
    </AppLayout>
  )
}
