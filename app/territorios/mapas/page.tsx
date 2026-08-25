import { MapsPageClient } from '@/components/admin/MapsPageClient'
import { getAllMaps, getAllGroups } from '@/server'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const [mapsResult, groupsResult] = await Promise.all([
    getAllMaps(),
    getAllGroups(),
  ])

  return (
    <MapsPageClient
      initialMaps={mapsResult.data}
      groups={groupsResult.success ? groupsResult.data : []}
    />
  )
}
