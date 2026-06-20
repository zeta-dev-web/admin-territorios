import { AppLayout } from '@/components/common/AppLayout'
import { MapsPageClient } from '@/components/admin/MapsPageClient'
import { getAllMaps, getAllGroups } from '@/server'

export default async function MapsPage() {
  const [mapsResult, groupsResult] = await Promise.all([
    getAllMaps(),
    getAllGroups(),
  ])

  return (
    <AppLayout title="Mapas de Territorios">
      <MapsPageClient
        initialMaps={mapsResult.data}
        groups={groupsResult.success ? groupsResult.data : []}
      />
    </AppLayout>
  )
}
