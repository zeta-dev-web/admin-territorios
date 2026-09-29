'use client'

import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerritoryCompletion, TerritoryFrequency } from '@/types'
import { TerritoryFrequencyList } from '@/components/territories/TerritoryFrequencyList'

interface MasTrabajadosSectionProps {
  completions: TerritoryCompletion[]
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
  30: 'Trabajados en el último mes',
  90: 'Trabajados en los últimos 3 meses',
  180: 'Trabajados en los últimos 6 meses',
}

const QUICK_EMPTY: Record<QuickOption, string> = {
  30: 'Ningún territorio se trabajó en el último mes',
  90: 'Ningún territorio se trabajó en los últimos 3 meses',
  180: 'Ningún territorio se trabajó en los últimos 6 meses',
}

function startOfDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function endOfDay(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

export function MasTrabajadosSection({ completions }: MasTrabajadosSectionProps) {
  const [mode, setMode] = useState<FilterMode>(180)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const frequencies = useMemo<TerritoryFrequency[]>(() => {
    let inScope: TerritoryCompletion[]

    if (mode !== 'custom') {
      // Trabajos finalizados dentro de los últimos X días
      const cutoff = new Date()
      cutoff.setHours(0, 0, 0, 0)
      cutoff.setDate(cutoff.getDate() - mode)
      inScope = completions.filter(
        (c) => c.completedAt && new Date(c.completedAt) >= cutoff
      )
    } else {
      // Rango personalizado: trabajos finalizados dentro del periodo
      // (los sin fecha se incluyen, igual que en Atrasados)
      const from = desde ? startOfDay(desde) : null
      const to = hasta ? endOfDay(hasta) : null
      if (!from && !to) {
        inScope = completions
      } else {
        inScope = completions.filter((c) => {
          if (!c.completedAt) return true
          const done = new Date(c.completedAt)
          if (from && done < from) return false
          if (to && done > to) return false
          return true
        })
      }
    }

    // Agrupar por territorio y ordenar: los más trabajados primero
    const counts = new Map<string, TerritoryFrequency>()
    for (const c of inScope) {
      const existing = counts.get(c.territoryId)
      if (existing) {
        existing.completedAssignments += 1
      } else {
        counts.set(c.territoryId, {
          territoryId: c.territoryId,
          territoryNumber: c.territoryNumber,
          completedAssignments: 1,
        })
      }
    }
    return [...counts.values()].sort(
      (a, b) => b.completedAssignments - a.completedAssignments
    )
  }, [completions, mode, desde, hasta])

  const subtitle =
    mode === 'custom'
      ? desde || hasta
        ? `Trabajados entre ${desde || '…'} y ${hasta || '…'}`
        : 'Todo el historial'
      : QUICK_SUBTITLES[mode]

  const filterKey = mode === 'custom' ? `custom-${desde}-${hasta}` : `quick-${mode}`

  const selectClass =
    'w-full sm:w-auto bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 [color-scheme:dark]'

  const dateClass =
    'mt-1 w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 [color-scheme:dark]'

  return (
    <section className="bg-[#0F1729] rounded-xl border border-slate-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">
            Territorios más trabajados{' '}
            <span className="text-sm font-medium text-red-500">({frequencies.length})</span>
          </h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Filtro rápido: botones en mobile */}
      <div className="grid grid-cols-4 gap-2 mb-3 sm:hidden" role="group" aria-label="Filtrar más trabajados">
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
                ? 'w-full border-red-500 bg-red-500/20 text-red-300 font-semibold hover:bg-red-500/25 hover:text-red-200'
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
              ? 'w-full border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/25'
              : 'w-full'
          }
        >
          Otro
        </Button>
      </div>

      {/* Filtro rápido: select en desktop */}
      <div className="hidden sm:flex items-center gap-3 mb-4">
        <label htmlFor="mas-trabajados-filter" className="text-sm text-slate-400">
          Mostrar trabajados en:
        </label>
        <select
          id="mas-trabajados-filter"
          value={String(mode)}
          onChange={(e) =>
            setMode(e.target.value === 'custom' ? 'custom' : (Number(e.target.value) as QuickOption))
          }
          className={selectClass}
        >
          <option value="30">Último mes</option>
          <option value="90">Últimos 3 meses</option>
          <option value="180">Últimos 6 meses</option>
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

      {frequencies.length > 0 ? (
        <TerritoryFrequencyList key={filterKey} frequencies={frequencies} />
      ) : (
        <div className="text-center py-8 text-slate-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {mode === 'custom'
              ? 'Ningún territorio se trabajó dentro del periodo elegido'
              : QUICK_EMPTY[mode]}
          </p>
        </div>
      )}
    </section>
  )
}
