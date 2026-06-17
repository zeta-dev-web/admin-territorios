import { getUnifiedAssignments } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { UnifiedAssignmentsTable } from '@/components/admin/UnifiedAssignmentsTable'
import { CreateAssignmentModal } from '@/components/admin/CreateAssignmentModal'
import { CreatePersonalAssignmentModal } from '@/components/admin/CreatePersonalAssignmentModal'
import { Pagination } from '@/components/common/Pagination'
import { ClipboardList } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function AssignmentsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const pageSize = Math.max(1, Math.min(50, Number(sp?.pageSize) || 10))

  const result = await getUnifiedAssignments(page, pageSize)
  const assignments = result.success ? result.data : []
  const total = result.success ? result.total : 0
  const totalPages = result.success ? result.totalPages : 0
  const conductorCount = result.success ? (result as any).conductorCount ?? 0 : 0
  const personalCount = result.success ? (result as any).personalCount ?? 0 : 0
  const uniqueTerritories = result.success ? (result as any).uniqueTerritories ?? 0 : 0

  return (
    <AppLayout title="Asignaciones">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Asignaciones</h1>
              <p className="text-sm text-slate-400">
                Todas las asignaciones activas en un solo lugar
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <CreateAssignmentModal />
            <CreatePersonalAssignmentModal />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Total Activas</p>
            <p className="text-2xl font-bold text-purple-500 mt-1">{total}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Conductores</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">{conductorCount}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Personales</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{personalCount}</p>
          </div>
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
            <p className="text-sm font-medium text-slate-400">Territorios Únicos</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">{uniqueTerritories}</p>
          </div>
        </div>

        {/* Tabla Unificada */}
        <div className="bg-[#0F1729] rounded-xl border border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Todas las Asignaciones</h2>
            <div className="flex gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Conductor
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Personal
              </span>
            </div>
          </div>
          <UnifiedAssignmentsTable assignments={assignments} />
          <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} />
        </div>
      </div>
    </AppLayout>
  )
}
