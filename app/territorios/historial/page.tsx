import { getUnifiedHistory, getAvailableTerritoryRanges } from '@/server'
import { HistoryTable } from '@/components/admin/HistoryTable'
import { ExportPdfButton } from '@/components/admin/ExportPdfButton'
import { Pagination } from '@/components/common/Pagination'
import { History } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page) || 1)
  const pageSize = Math.max(1, Math.min(50, Number(sp?.pageSize) || 10))

  const result = await getUnifiedHistory(page, pageSize)
  const history = result.success ? result.data : []
  const total = result.success ? result.total : 0
  const totalPages = result.success ? result.totalPages : 0
  const thisMonthCount = result.success ? (result as any).thisMonthCount ?? 0 : 0
  const thisYearCount = result.success ? (result as any).thisYearCount ?? 0 : 0
  const uniqueTerritories = result.success ? (result as any).uniqueTerritories ?? 0 : 0

  // Obtener rangos para exportación PDF
  const availableRanges = await getAvailableTerritoryRanges()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
            <History className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Territorios</h1>
            <p className="text-sm text-slate-400">
              Registro completo de todos los territorios completados o devueltos
            </p>
          </div>
        </div>

        {/* Botón de exportación */}
        <ExportPdfButton availableRanges={availableRanges} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Total Completados</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{total}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Este Mes</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{thisMonthCount}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Este Año</p>
          <p className="text-2xl font-bold text-purple-500 mt-1">{thisYearCount}</p>
        </div>
        <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-4">
          <p className="text-sm font-medium text-slate-400">Territorios Únicos</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{uniqueTerritories}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F1729] rounded-xl border border-slate-800">
        <HistoryTable assignments={history} />
        <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} />
      </div>
    </div>
  )
}
