'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  deleteUnifiedAssignment,
  getAllDriversForSelect,
  getAllMembersForSelect,
  getAllTerritoriesForSelect,
  getAssignmentById,
  updateUnifiedAssignment,
} from '@/server'
import type { UnifiedAssignment } from '@/server/unifiedAssignments'

interface TerritoryOption {
  id: string
  number: number
  description: string | null
  blocks?: Array<{ letter: string }>
}

interface AssigneeOption {
  id: string
  name: string
  group: { name: string }
}

interface BlockWorkState {
  letter: string
  completed: boolean
  date: string
  notes?: string
}

interface EditProps {
  assignment: UnifiedAssignment
  onClose: (changed?: boolean) => void
}

const today = () => new Date().toISOString().split('T')[0]
const inputDate = (value: Date | string) => new Date(value).toISOString().split('T')[0]

export function EditActiveAssignmentModal({ assignment, onClose }: EditProps) {
  const congregational = assignment.type === 'CONDUCTOR'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [territories, setTerritories] = useState<TerritoryOption[]>([])
  const [assignees, setAssignees] = useState<AssigneeOption[]>([])
  const [territoryId, setTerritoryId] = useState(assignment.territoryId)
  const [assigneeId, setAssigneeId] = useState(assignment.assigneeId)
  const [assignedDate, setAssignedDate] = useState(inputDate(assignment.assignedDate))
  const [notes, setNotes] = useState(assignment.notes ?? '')
  const [territorySearch, setTerritorySearch] = useState('')
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [blockWork, setBlockWork] = useState<BlockWorkState[]>([])

  useEffect(() => {
    let active = true

    async function loadOptions() {
      setLoading(true)
      const [territoryResult, assigneeResult, detailResult] = await Promise.all([
        getAllTerritoriesForSelect(),
        congregational ? getAllDriversForSelect() : getAllMembersForSelect(),
        congregational ? getAssignmentById(assignment.id) : Promise.resolve(null),
      ])

      if (!active) return
      if (!territoryResult.success || !assigneeResult.success) {
        setError('No se pudieron cargar las opciones de edición.')
        setLoading(false)
        return
      }

      setTerritories(territoryResult.data)
      setAssignees(assigneeResult.data)

      if (congregational && detailResult?.success && detailResult.data) {
        const latestByLetter = new Map<string, { date: Date; notes: string | null }>()
        detailResult.data.dailyRecords.forEach((record) => {
          if (!latestByLetter.has(record.block.letter)) {
            latestByLetter.set(record.block.letter, { date: record.date, notes: record.notes })
          }
        })
        setBlockWork(
          [...detailResult.data.blocks]
            .sort((a, b) => a.letter.localeCompare(b.letter))
            .map((block) => {
              const work = latestByLetter.get(block.letter)
              return {
                letter: block.letter,
                completed: Boolean(work),
                date: work ? inputDate(work.date) : today(),
                notes: work?.notes ?? undefined,
              }
            }),
        )
      } else if (congregational) {
        setError(detailResult?.message || 'No se pudo cargar el trabajo registrado.')
      }

      setLoading(false)
    }

    void loadOptions()
    return () => {
      active = false
    }
  }, [assignment.id, congregational])

  const selectedTerritory = territories.find((item) => item.id === territoryId)
  const selectedAssignee = assignees.find((item) => item.id === assigneeId)
  const territoryResults = useMemo(() => {
    const query = territorySearch.trim().toLowerCase()
    if (!query) return []
    return territories
      .filter((item) =>
        item.number.toString().includes(query) || item.description?.toLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [territories, territorySearch])
  const assigneeResults = useMemo(() => {
    const query = assigneeSearch.trim().toLowerCase()
    if (!query) return []
    return assignees
      .filter((item) =>
        item.name.toLowerCase().includes(query) || item.group.name.toLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [assignees, assigneeSearch])
  const completedCount = blockWork.filter((item) => item.completed).length

  function selectTerritory(territory: TerritoryOption) {
    setTerritoryId(territory.id)
    setTerritorySearch('')
    if (!congregational) return

    const currentByLetter = new Map(blockWork.map((item) => [item.letter, item]))
    setBlockWork(
      (territory.blocks ?? []).map((block) =>
        currentByLetter.get(block.letter) ?? {
          letter: block.letter,
          completed: false,
          date: today(),
        },
      ),
    )
  }

  function updateBlock(letter: string, patch: Partial<BlockWorkState>) {
    setBlockWork((current) =>
      current.map((item) => (item.letter === letter ? { ...item, ...patch } : item)),
    )
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!territoryId || !assigneeId || !assignedDate) {
      setError('Completá territorio, responsable y fecha de asignación.')
      return
    }

    const invalidWork = blockWork.find((item) => item.completed && !item.date)
    if (invalidWork) {
      setError(`Indicá la fecha de trabajo de la manzana ${invalidWork.letter}.`)
      return
    }

    setSaving(true)
    setError('')
    const result = await updateUnifiedAssignment(assignment.id, assignment.type, {
      territoryId,
      ...(congregational ? { driverId: assigneeId } : { memberId: assigneeId }),
      ...(congregational
        ? { startDate: new Date(`${assignedDate}T12:00:00`) }
        : { assignedDate: new Date(`${assignedDate}T12:00:00`), notes }),
      ...(congregational
        ? {
            blockWork: blockWork
              .filter((item) => item.completed)
              .map((item) => ({
                letter: item.letter,
                date: new Date(`${item.date}T12:00:00`),
                notes: item.notes,
              })),
          }
        : {}),
    })
    setSaving(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    toast.success(result.message)
    onClose(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !saving && onClose()} />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-blue-400/20 bg-[#0B1426] shadow-2xl shadow-blue-950/50">
        <header className="flex items-start justify-between border-b border-slate-800 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-400/5 px-5 py-5 sm:px-7">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
              <Pencil className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Editar asignación</p>
              <h2 className="mt-1 text-xl font-bold text-white">Territorio {assignment.territoryNumber}</h2>
              <p className="mt-1 text-sm text-slate-400">Corregí los datos sin perder el control del historial.</p>
            </div>
          </div>
          <button type="button" onClick={() => onClose()} disabled={saving} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
                <span>Cargando datos de la asignación...</span>
              </div>
            ) : (
              <>
                {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

                <div className="grid gap-5 md:grid-cols-2">
                  <SearchField label="Territorio" icon={MapPin} value={territorySearch} onChange={setTerritorySearch} placeholder="Buscar número o descripción">
                    {selectedTerritory && <SelectedOption label={`Territorio ${selectedTerritory.number}`} detail={selectedTerritory.description} />}
                    <SearchResults items={territoryResults} empty={Boolean(territorySearch.trim())} renderLabel={(item) => `Territorio ${item.number}`} renderDetail={(item) => item.description} onSelect={selectTerritory} />
                  </SearchField>

                  <SearchField label={congregational ? 'Conductor' : 'Integrante'} icon={UserRound} value={assigneeSearch} onChange={setAssigneeSearch} placeholder={`Buscar ${congregational ? 'conductor' : 'integrante'}`}>
                    {selectedAssignee && <SelectedOption label={selectedAssignee.name} detail={selectedAssignee.group.name} />}
                    <SearchResults items={assigneeResults} empty={Boolean(assigneeSearch.trim())} renderLabel={(item) => item.name} renderDetail={(item) => item.group.name} onSelect={(item) => { setAssigneeId(item.id); setAssigneeSearch('') }} />
                  </SearchField>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><CalendarDays className="h-4 w-4 text-cyan-300" />Fecha de asignación</span>
                    <input type="date" value={assignedDate} onChange={(event) => setAssignedDate(event.target.value)} max={today()} required className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
                  </label>
                  {!congregational && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-200">Notas</span>
                      <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Observaciones opcionales" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
                    </label>
                  )}
                </div>

                {congregational && (
                  <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Trabajo registrado</p>
                        <h3 className="mt-1 text-lg font-bold text-white">Corregir manzanas</h3>
                        <p className="mt-1 text-sm text-slate-400">Marcá las trabajadas y ajustá la fecha si fue registrada incorrectamente.</p>
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">{completedCount} de {blockWork.length}</span>
                    </div>

                    {blockWork.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">Este territorio no tiene manzanas cargadas.</div>
                    ) : (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {blockWork.map((block) => (
                          <div key={block.letter} className={`rounded-xl border p-3 transition ${block.completed ? 'border-emerald-400/35 bg-emerald-400/10' : 'border-slate-700 bg-slate-900'}`}>
                            <button type="button" onClick={() => updateBlock(block.letter, { completed: !block.completed })} className="flex w-full items-center gap-3 text-left">
                              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${block.completed ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{block.letter.toUpperCase()}</span>
                              <span className="flex-1"><span className="block font-semibold text-white">Manzana {block.letter.toUpperCase()}</span><span className="text-xs text-slate-400">{block.completed ? 'Trabajo registrado' : 'Pendiente'}</span></span>
                              {block.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : <span className="h-5 w-5 rounded-full border-2 border-slate-600" />}
                            </button>
                            {block.completed && <input type="date" value={block.date} onChange={(event) => updateBlock(block.letter, { date: event.target.value })} max={today()} className="mt-3 w-full rounded-lg border border-emerald-400/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-300" aria-label={`Fecha de trabajo de manzana ${block.letter}`} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {blockWork.length > 0 && completedCount === blockWork.length && (
                      <div className="mt-4 flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Al guardar todas las manzanas como trabajadas, la asignación pasará al historial como completada.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          <footer className="flex gap-3 border-t border-slate-800 bg-[#0B1426] px-5 py-4 sm:justify-end sm:px-7">
            <button type="button" onClick={() => onClose()} disabled={saving} className="flex-1 rounded-xl border border-slate-700 px-5 py-2.5 font-semibold text-slate-300 transition hover:bg-slate-800 sm:flex-none">Cancelar</button>
            <button type="submit" disabled={loading || saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export function DeleteActiveAssignmentModal({ assignment, onClose }: EditProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    const result = await deleteUnifiedAssignment(assignment.id, assignment.type)
    setDeleting(false)
    if (!result.success) {
      setError(result.message)
      return
    }
    toast.success('Asignación eliminada correctamente')
    onClose(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => !deleting && onClose()} />
      <div className="relative w-full max-w-md rounded-3xl border border-red-400/20 bg-[#0B1426] p-6 shadow-2xl shadow-red-950/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10"><Trash2 className="h-6 w-6 text-red-400" /></div>
        <h2 className="mt-5 text-xl font-bold text-white">Eliminar asignación</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Se eliminará la asignación del territorio {assignment.territoryNumber} a {assignment.assigneeName}. También se borrarán sus trabajos registrados y el territorio volverá a quedar disponible.</p>
        {error && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => onClose()} disabled={deleting} className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 font-semibold text-slate-300 hover:bg-slate-800">Cancelar</button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 font-bold text-white hover:bg-red-400 disabled:opacity-50">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SearchField({ label, icon: Icon, value, onChange, placeholder, children }: { label: string; icon: typeof Search; value: string; onChange: (value: string) => void; placeholder: string; children: React.ReactNode }) {
  return <div className="relative"><label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><Icon className="h-4 w-4 text-cyan-300" />{label}</label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-10 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />{value && <button type="button" onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}</div>{children}</div>
}

function SelectedOption({ label, detail }: { label: string; detail?: string | null }) {
  return <div className="mt-2 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2"><Check className="h-4 w-4 text-cyan-300" /><span className="text-sm font-semibold text-cyan-100">{label}</span>{detail && <span className="truncate text-xs text-slate-400">· {detail}</span>}</div>
}

function SearchResults<T extends { id: string }>({ items, empty, renderLabel, renderDetail, onSelect }: { items: T[]; empty: boolean; renderLabel: (item: T) => string; renderDetail: (item: T) => string | null | undefined; onSelect: (item: T) => void }) {
  if (!empty) return null
  return <div className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">{items.length ? items.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-800"><span className="text-sm font-semibold text-slate-100">{renderLabel(item)}</span><span className="truncate text-xs text-slate-500">{renderDetail(item)}</span></button>) : <p className="px-3 py-4 text-center text-sm text-slate-500">Sin coincidencias</p>}</div>
}
