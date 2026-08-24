import { getDashboardMetrics } from '@/server'
import { TerritoryCard } from '@/components/territories/TerritoryCard'
import { AtrasadosList } from '@/components/territories/AtrasadosList'
import { TerritoryFrequencyList } from '@/components/territories/TerritoryFrequencyList'
import { AppLayout } from '@/components/common/AppLayout'
import { Activity, Clock, BarChart3, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <AppLayout title="Territorios">
      <div className="p-6 space-y-6">
        {/* Layout principal: Stats unificados + Territorio activo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats unificados */}
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Estadísticas</h2>
                <p className="text-sm text-slate-400">Resumen general</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Activos */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Activos</p>
                    <p className="text-xs text-slate-500">En progreso actualmente</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-500">
                    {metrics.activeTerritoriesProgress.length}
                  </p>
                </div>
              </div>

              {/* Atrasados */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-orange-500 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Atrasados</p>
                    <p className="text-xs text-slate-500">+6 meses sin asignarse</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-500">
                    {metrics.atrasados.length}
                  </p>
                </div>
              </div>

              {/* Total Trabajados */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-red-500 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400">Total Trabajados</p>
                    <p className="text-xs text-slate-500">Asignaciones completadas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-500">
                    {metrics.territoryFrequency.reduce((acc, t) => acc + t.completedAssignments, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Territorio Activo */}
          <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Territorios Activos</h2>
                <p className="text-sm text-slate-400">En progreso actualmente</p>
              </div>
            </div>

            {metrics.activeTerritoriesProgress.length > 0 ? (
              <TerritoryCard territories={metrics.activeTerritoriesProgress} />
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-white font-medium mb-2">
                  No hay territorios activos
                </p>
                <p className="text-sm text-slate-400">
                  Crea una nueva asignación para comenzar
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Grid de 2 columnas: Atrasados y Frecuencia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Territorios Atrasados */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Territorios Atrasados
                </h2>
                <p className="text-sm text-slate-400">+6 meses sin asignarse</p>
              </div>
            </div>
            <AtrasadosList territories={metrics.atrasados} />
          </section>

          {/* Frecuencia */}
          <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Frecuencia de Trabajo
                </h2>
                <p className="text-sm text-slate-400">Territorios más trabajados</p>
              </div>
            </div>
            <TerritoryFrequencyList frequencies={metrics.territoryFrequency} />
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
