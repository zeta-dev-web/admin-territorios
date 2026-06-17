import { getTerritoryProgress, getDailyRecordsByAssignment } from '@/server'
import { AppLayout } from '@/components/common/AppLayout'
import { BlockGrid } from '@/components/territories/BlockGrid'
import { DailyRecordForm } from '@/components/territories/DailyRecordForm'
import { DailyRecordsTimeline } from '@/components/territories/DailyRecordsTimeline'
import { User, Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface TerritoryDetailPageProps {
  params: {
    territoryId: string
  }
}

export default async function TerritoryDetailPage({
  params,
}: TerritoryDetailPageProps) {
  const { territoryId } = params
  const result = await getTerritoryProgress(territoryId)

  if (!result.success || !result.data) {
    notFound()
  }

  const { assignment, progress } = result.data
  const recordsResult = await getDailyRecordsByAssignment(assignment.id)
  const records = recordsResult.success ? recordsResult.data : []

  const daysSinceStart = Math.ceil(
    (new Date().getTime() - new Date(assignment.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <AppLayout title={`Territorio ${assignment.territory.number}`} showBack>
      <div className="p-6 space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Territorio {assignment.territory.number}
              </h1>
              {assignment.territory.description && (
                <p className="text-white/80">
                  {assignment.territory.description}
                </p>
              )}
            </div>

            {assignment.isCompleted ? (
              <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Completado</span>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="font-semibold">En Progreso</span>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <User className="h-4 w-4" />
                <span>Conductor</span>
              </div>
              <p className="font-semibold text-lg">{assignment.driver.name}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <Calendar className="h-4 w-4" />
                <span>Inicio</span>
              </div>
              <p className="font-semibold text-lg">
                {formatDateShort(assignment.startDate)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso Total</span>
              <span className="text-2xl font-bold">{progress.progressPercentage}%</span>
            </div>

            <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all shadow-lg"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{progress.completedBlocks} / {progress.totalBlocks} manzanas</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{daysSinceStart} días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de manzanas */}
        <section className="bg-[#0F1729] rounded-xl shadow-sm border border-slate-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Manzanas</h2>
          <BlockGrid blocks={progress.blocks} />
        </section>

        {/* Formulario de registro */}
        {!assignment.isCompleted && (
          <section className="bg-[#0F1729] rounded-xl shadow-sm border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Registrar Trabajo
            </h2>
            <DailyRecordForm
              assignmentId={assignment.id}
              driverId={assignment.driverId}
              blocks={progress.blocks}
            />
          </section>
        )}

        {/* Timeline */}
        {records.length > 0 && (
          <section className="bg-[#0F1729] rounded-xl shadow-sm border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              Historial de Trabajo
            </h2>
            <DailyRecordsTimeline records={records} />
          </section>
        )}
      </div>
    </AppLayout>
  )
}
