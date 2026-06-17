import { getDashboardMetrics } from '@/server'
import { TerritoryCard } from '@/components/territories/TerritoryCard'
import { AtrasadosList } from '@/components/territories/AtrasadosList'
import { TerritoryFrequencyList } from '@/components/territories/TerritoryFrequencyList'
import { AppLayout } from '@/components/common/AppLayout'
import { Activity, Clock, BarChart3, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics()

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0F1729] rounded-xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Activos</p>
                <p className="text-3xl font-bold text-red-500 mt-1">
                  {metrics.activeTerritoriesProgress.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#0F1729] rounded-xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Atrasados</p>
                <p className="text-3xl font-bold text-orange-500 mt-1">
                  {metrics.atrasados.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#0F1729] rounded-xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Trabajados</p>
                <p className="text-3xl font-bold text-red-500 mt-1">
                  {metrics.territoryFrequency.reduce((acc, t) => acc + t.completedAssignments, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Territorios Activos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Territorios Activos
                </h2>
                <p className="text-sm text-slate-400">En progreso actualmente</p>
              </div>
            </div>
            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-semibold">
              {metrics.activeTerritoriesProgress.length}
            </span>
          </div>

          {metrics.activeTerritoriesProgress.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {metrics.activeTerritoriesProgress.map((territory) => (
                <TerritoryCard key={territory.territoryId} territory={territory} />
              ))}
            </div>
          ) : (
            <div className="bg-[#0F1729] rounded-xl border border-slate-800 p-12 text-center">
              <Activity className="h-16 w-16 mx-auto mb-4 text-slate-600" />
              <p className="text-white font-medium mb-2">
                No hay territorios activos
              </p>
              <p className="text-sm text-slate-400">
                Crea una nueva asignación para comenzar
              </p>
            </div>
          )}
        </section>

        {/* Grid de 2 columnas */}
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
