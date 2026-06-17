'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin, UserCircle, Calendar, CheckCircle, User, Loader2,
  ArrowLeftRight, Grid3x3, X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { returnUnifiedAssignment, getAssignmentBlocks } from '@/server'
import type { UnifiedAssignment, UnifiedAssignmentType } from '@/server/unifiedAssignments'
import { QuickBlockRegistration } from './QuickBlockRegistration'
import type { BlockStatus } from '@/types'
import { Table } from '@/components/common/Table'

interface Props {
  assignments: UnifiedAssignment[]
  showHistory?: boolean
}

export function UnifiedAssignmentsTable({ assignments, showHistory = false }: Props) {
  const router = useRouter()
  const [returningId, setReturningId] = useState<string | null>(null)
  const [returnModal, setReturnModal] = useState<{
    assignment: UnifiedAssignment
    returnDate: string
  } | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string
    type: UnifiedAssignmentType
    territoryNumber: number
    assigneeName: string
    assigneeId: string
    blocks: BlockStatus[]
  } | null>(null)

  async function handleReturnWithDate() {
    if (!returnModal) return

    const { assignment, returnDate } = returnModal
    setReturningId(assignment.id)
    setReturnModal(null)

    const dateObj = returnDate ? new Date(returnDate + 'T12:00:00') : undefined
    const result = await returnUnifiedAssignment(assignment.id, assignment.type, dateObj)
    setReturningId(null)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.message)
    }
  }

  function openReturnModal(assignment: UnifiedAssignment) {
    const hoy = new Date().toISOString().split('T')[0]
    setReturnModal({
      assignment,
      returnDate: hoy,
    })
  }

  function formatDate(date: Date | null | undefined) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
  }

  if (assignments.length === 0) {
    return (
      <div className="p-12 text-center">
        <MapPin className="h-16 w-16 mx-auto mb-4 text-slate-600" />
        <p className="text-white font-medium mb-2">
          {showHistory ? 'No hay historial' : 'No hay asignaciones activas'}
        </p>
        <p className="text-sm text-slate-400">
          {showHistory
            ? 'Las asignaciones completadas o devueltas aparecerán aquí'
            : 'Usa los botones superiores para crear una nueva asignación'}
        </p>
      </div>
    )
  }

  return (
    <>
      <Table minWidth="900px">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Territorio
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Asignado a
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Grupo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {showHistory ? 'Asignado' : 'Desde'}
              </th>
              {showHistory && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Devuelto/Completado
                </th>
              )}
              {!showHistory && (
                <>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Tiempo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Progreso
                  </th>
                </>
              )}
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {assignments.map((assignment) => {
              const progress = assignment.blocksTotal
                ? Math.round(((assignment.blocksCompleted || 0) / assignment.blocksTotal) * 100)
                : null
              const showBar = progress !== null && !isNaN(progress)

              return (
                <tr key={`${assignment.type}-${assignment.id}`} className="hover:bg-slate-800/30 transition-colors">
                  {/* Territorio */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        assignment.type === 'CONDUCTOR'
                          ? 'bg-blue-500/10'
                          : 'bg-green-500/10'
                      }`}>
                        <MapPin className={`h-5 w-5 ${
                          assignment.type === 'CONDUCTOR' ? 'text-blue-500' : 'text-green-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Territorio {assignment.territoryNumber}
                        </p>
                        {assignment.territoryDescription && (
                          <p className="text-xs text-slate-400">
                            {assignment.territoryDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Asignado a */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {assignment.type === 'CONDUCTOR' ? (
                        <UserCircle className="h-4 w-4 text-slate-500" />
                      ) : (
                        <User className="h-4 w-4 text-slate-500" />
                      )}
                      <span className="text-sm text-white font-medium">
                        {assignment.assigneeName}
                      </span>
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      assignment.type === 'CONDUCTOR'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {assignment.type === 'CONDUCTOR' ? (
                        <UserCircle className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {assignment.type === 'CONDUCTOR' ? 'Conductor' : 'Personal'}
                    </span>
                  </td>

                  {/* Grupo */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300">
                      {assignment.groupName}
                    </span>
                  </td>

                  {/* Fechas */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-300">
                        {formatDate(assignment.assignedDate)}
                      </span>
                    </div>
                  </td>

                  {showHistory && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-400 font-medium">
                          {formatDate(assignment.endDate)}
                        </span>
                      </div>
                    </td>
                  )}

                  {!showHistory && (
                    <>
                      {/* Tiempo */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {formatDistanceToNow(new Date(assignment.assignedDate), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </td>

                      {/* Progreso (solo conductores) */}
                      <td className="px-6 py-4">
                        {assignment.type === 'CONDUCTOR' && showBar ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Grid3x3 className="h-4 w-4 text-slate-500" />
                              <span className="text-sm text-white font-medium">
                                {assignment.blocksCompleted} / {assignment.blocksTotal} manzanas
                              </span>
                            </div>
                            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                    </>
                  )}

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {!showHistory && (
                        <>
                          {/* Registrar manzanas (solo conductores) */}
                          {assignment.type === 'CONDUCTOR' && (
                            <button
                              onClick={async () => {
                                const result = await getAssignmentBlocks(assignment.id)
                                if (result.success && result.data) {
                                  setSelectedAssignment({
                                    id: assignment.id,
                                    type: assignment.type,
                                    territoryNumber: assignment.territoryNumber,
                                    assigneeName: assignment.assigneeName,
                                    assigneeId: assignment.assigneeId,
                                    blocks: result.data.blocks,
                                  })
                                } else {
                                  alert(result.message || 'Error al cargar manzanas')
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium border border-blue-500/30"
                              title="Registrar manzanas trabajadas"
                            >
                              <Grid3x3 className="h-4 w-4" />
                              <span className="hidden sm:inline">Manzanas</span>
                            </button>
                          )}

                          {/* Devolver */}
                          <button
                            onClick={() => openReturnModal(assignment)}
                            disabled={returningId === assignment.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium border disabled:opacity-50 disabled:cursor-not-allowed ${
                              assignment.type === 'CONDUCTOR'
                                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                            }`}
                            title={assignment.type === 'CONDUCTOR' ? 'Devolver territorio (aunque falten manzanas)' : 'Devolver territorio personal'}
                          >
                            {returningId === assignment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowLeftRight className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Devolver</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
      </Table>

      {/* Modal de devolución con fecha */}
      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReturnModal(null)} />
          <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Devolver Territorio</h2>
              <button
                onClick={() => setReturnModal(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <p className="text-white font-semibold">
                  Territorio {returnModal.assignment.territoryNumber}
                </p>
                <p className="text-sm text-slate-400">
                  Asignado a: <span className="text-white">{returnModal.assignment.assigneeName}</span>
                </p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  returnModal.assignment.type === 'CONDUCTOR'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'bg-green-500/10 text-green-400 border border-green-500/30'
                }`}>
                  {returnModal.assignment.type === 'CONDUCTOR' ? 'Conductor' : 'Personal'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha de devolución *
                </label>
                <input
                  type="date"
                  value={returnModal.returnDate}
                  onChange={(e) =>
                    setReturnModal({ ...returnModal, returnDate: e.target.value })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Fecha en que se devolvió o completó el territorio
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReturnModal(null)}
                  className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReturnWithDate}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Confirmar Devolución
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rápido para registrar manzanas */}
      {selectedAssignment && selectedAssignment.type === 'CONDUCTOR' && (
        <QuickBlockRegistration
          assignmentId={selectedAssignment.id}
          driverId={selectedAssignment.assigneeId}
          territoryNumber={selectedAssignment.territoryNumber}
          driverName={selectedAssignment.assigneeName}
          blocks={selectedAssignment.blocks}
          onClose={() => {
            setSelectedAssignment(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
