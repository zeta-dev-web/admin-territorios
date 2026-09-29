'use client'

import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AtrasadoTerritory } from '@/types'
import { AtrasadosList } from '@/components/territories/AtrasadosList'

interface AtrasadosSectionProps {
  territories: AtrasadoTerritory[]
}

type QuickOption = 30 | 90 | 180
type FilterMode = QuickOption | 'custom'

const QUICK_OPTIONS: QuickOption[] = [30, 90, 180]

const QUICK_LABELS: Record<QuickOption, string> = {
  30: '1 mes',
  90: '3 meses',
  180: '6 meses',
}

const QUICK_SUBTITLES: Record<QuickOption, string> = {
  30: '+1 mes sin asignarse',
  90: '+3 meses sin asignarse',
  180: '+6 meses sin asignarse',
}

const QUICK_EMPTY: Record<QuickOption, string> = {
  30: 'Todos los territorios libres se han asignado en el último mes',
  90: 'Todos los territorios libres se han asignado en los últimos 3 meses',
  180: 'Todos los territorios libres se han asignado en los últimos 6 meses',
}

function startOfDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function endOfDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

export function AtrasadosSection({ territories }: AtrasadosSectionProps) {
  const [mode, setMode] = useState<FilterMode>(180)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const filtered = useMemo(() => {
    if (mode !== 'custom') {
      // Umbral relativo a hoy hacia atrás: sin asignar hace más de X días
      return territories.filter(
        (t) => t.daysSinceLastAssignment === null || t.daysSinceLastAssignment > mode
      )
    }
    // Rango personalizado: última asignación fuera del periodo (o nunca asignado)
    const from = desde ? startOfDay(desde) : null
    const to = hasta ? endOfDay(hasta) : null
    if (!from && !to) return territories
    return territories.filter((t) => {
      if (!t.lastAssignmentDate) return true
      const last = new Date(t.lastAssignmentDate)
      if (from && last < from) return true
      if (to && last > to) return true
      return false
    })
  }, [territories, mode, desde, hasta])

  const subtitle =
    mode === 'custom'
      ? desde || hasta
        ? `Sin asignarse entre ${desde || '…'} y ${hasta || '…'}`
        : 'Elegí un periodo específico'
      : QUICK_SUBTITLES[mode]

  const filterKey = mode === 'custom' ? `custom-${desde}-${hasta}` : `quick-${mode}`

  const selectClass =
    'w-full sm:w-auto bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 [color-scheme:dark]'

  const dateClass =
    'mt-1 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 [color-scheme:dark]'

  return (
    <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
          <Clock className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">
            Territorios Atrasados{' '}
            <span className="text-sm font-medium text-orange-500">({filtered.length})</span>
          </h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Filtro rápido: botones en mobile */}
      <div className="grid grid-cols-4 gap-2 mb-3 sm:hidden" role="group" aria-label="Filtrar atrasados">
        {QUICK_OPTIONS.map((days) => (
          <Button
            key={days}
            type="button"
            onClick={() => setMode(days)}
            aria-pressed={mode === days}
            variant="outline"
            size="sm"
            className={
              mode === days
                ? 'w-full border-orange-500 bg-orange-500/20 text-orange-300 font-semibold hover:bg-orange-500/25 hover:text-orange-200'
                : 'w-full'
            }
          >
            {QUICK_LABELS[days]}
          </Button>
        ))}
        <Button
          type="button"
          onClick={() => setMode('custom')}
          aria-pressed={mode === 'custom'}
          variant="outline"
          size="sm"
          className={
            mode === 'custom'
              ? 'w-full border-orange-500 bg-orange-500/20 text-orange-400 hover:bg-orange-500/25'
              : 'w-full'
          }
        >
          Otro
        </Button>
      </div>

      {/* Filtro rápido: select en desktop */}
      <div className="hidden sm:flex items-center gap-3 mb-4">
        <label htmlFor="atrasados-filter" className="text-sm text-slate-400">
          Mostrar sin asignarse hace:
        </label>
        <select
          id="atrasados-filter"
          value={String(mode)}
          onChange={(e) =>
            setMode(e.target.value === 'custom' ? 'custom' : (Number(e.target.value) as QuickOption))
          }
          className={selectClass}
        >
          <option value="30">1 mes</option>
          <option value="90">3 meses</option>
          <option value="180">6 meses</option>
          <option value="custom">Periodo específico…</option>
        </select>
      </div>

      {/* Rango personalizado */}
      {mode === 'custom' && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <label className="flex-1 text-sm text-slate-400">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className={dateClass}
            />
          </label>
          <label className="flex-1 text-sm text-slate-400">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className={dateClass}
            />
          </label>
        </div>
      )}

      <AtrasadosList
        key={filterKey}
        territories={filtered}
        emptyHint={
          mode === 'custom'
            ? 'Todos los territorios libres se asignaron dentro del periodo elegido'
            : QUICK_EMPTY[mode]
        }
      />
    </section>
  )
}
