import { getAllDrivers, getAllGroups } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { DriversTable } from '@/components/admin/DriversTable'
import { CreateDriverModal } from '@/components/admin/CreateDriverModal'
import { Pagination } from '@/components/common/Pagination'
import { UserCircle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function DriversPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const pageSize = Math.max(1, Math.min(50, Number(sp?.pageSize) || 10))

  const [driversResult, groupsResult] = await Promise.all([
    getAllDrivers(page, pageSize),
    getAllGroups(),
  ])

  const drivers = driversResult.success ? driversResult.data : []
  const total = driversResult.success ? driversResult.total : 0
  const totalPages = driversResult.success ? driversResult.totalPages : 0
  const driversWithActive = driversResult.success ? (driversResult as any).driversWithActiveAssignments ?? 0 : 0

  const groups = groupsResult.success ? groupsResult.data : []
  const totalPublishers = groups.reduce((acc: number, g: any) => acc + g.members.length, 0)
  const publishersWithTerritory = groups.reduce((acc: number, g: any) =>
    acc + g.members.filter((m: any) => m.personalAssignments.some((pa: any) => pa.isActive)).length, 0
  )

  return (
    <AppLayout title="Conductores">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Conductores</h1>
              <p className="text-sm text-slate-400">
                Gestiona los conductores del sistema
              </p>
            </div>
          </div>
          <CreateDriverModal />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Total Conductores</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{total}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Con Asignaciones Activas</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{driversWithActive}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">
              {totalPublishers} Publicadores ({publishersWithTerritory} con territorio)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Gestiona los publicadores desde la sección Grupos
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Conductores</h2>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800">
            <DriversTable drivers={drivers} />
            <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
