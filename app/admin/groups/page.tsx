import { getAllGroups } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { GroupsTable } from '@/components/admin/GroupsTable'
import { CreateGroupModal } from '@/components/admin/CreateGroupModal'
import { Users } from 'lucide-react'

export default async function GroupsPage() {
  const result = await getAllGroups()
  const groups = result.success ? result.data : []

  // Calcular totales únicos
  const uniqueDrivers = new Set(
    groups.flatMap(g => g.drivers.map(d => d.name.toLowerCase()))
  ).size

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0)

  return (
    <AppLayout title="Grupos">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Grupos</h1>
              <p className="text-sm text-slate-400">
                Gestiona los grupos de conductores y publicadores
              </p>
            </div>
          </div>

          <CreateGroupModal />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Total Grupos</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {groups.length}
            </p>
          </div>

          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Total Conductores</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">
              {uniqueDrivers}
            </p>
          </div>

          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Total Publicadores</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {totalMembers}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0F1729] rounded-xl border border-slate-800">
          <GroupsTable groups={groups} />
        </div>
      </div>
    </AppLayout>
  )
}
