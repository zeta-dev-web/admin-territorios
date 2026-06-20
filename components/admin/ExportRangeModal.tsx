'use client'

import { useState, useRef, useEffect } from 'react'
import { FileDown, X, Calendar, MapPin, Loader2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportTerritoryHistoryPdf } from '@/server/territoryExport'
import toast from 'react-hot-toast'
import type { TerritoryRange } from '@/types'

interface ExportRangeModalProps {
  isOpen: boolean
  onClose: () => void
  availableRanges: TerritoryRange[]
  onExportingChange: (exporting: boolean) => void
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

interface MonthKey {
  year: number
  month: number // 1-12
}

const formatKey = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`
const parseKey = (k: string) => {
  const [y, m] = k.split('-').map(Number)
  return { year: y, month: m }
}

interface MonthPickerProps {
  value: string
  onChange: (key: string) => void
  minKey?: string
  disabled?: boolean
  label: string
}

function MonthPicker({ value, onChange, minKey, disabled, label }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseKey(value).year
    if (minKey) return parseKey(minKey).year
    const now = new Date()
    return now.getFullYear()
  })
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const parsed = value ? parseKey(value) : null
  const currentYear = new Date().getFullYear()

  const canGoNext = viewYear < currentYear + 5
  const canGoPrev = !minKey || viewYear > parseKey(minKey).year

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const isDisabled = (m: number) => {
    if (!minKey) return false
    const min = parseKey(minKey)
    return viewYear < min.year || (viewYear === min.year && m < min.month)
  }

  return (
    <div className="relative">
      <p className="text-xs text-slate-500 mb-1.5 ml-1">{label}</p>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:border-slate-600 transition-colors disabled:opacity-50 text-sm"
      >
        <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
        <span className="flex-1 text-left">
          {parsed ? `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}` : 'Seleccionar'}
        </span>
        <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3"
        >
          {/* Navegación de año */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setViewYear(y => y - 1)}
              disabled={!canGoPrev}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-slate-300" />
            </button>
            <span className="text-sm font-semibold text-white">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(y => y + 1)}
              disabled={!canGoNext}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>

          {/* Grilla de meses 3x4 */}
          <div className="grid grid-cols-3 gap-1.5">
            {months.map(m => {
              const selected = parsed?.year === viewYear && parsed?.month === m
              const disabled = isDisabled(m)
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(formatKey(viewYear, m))
                    setOpen(false)
                  }}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  {MONTH_NAMES_SHORT[m - 1]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ExportRangeModal({
  isOpen,
  onClose,
  availableRanges,
  onExportingChange,
}: ExportRangeModalProps) {
  const [selectedFrom, setSelectedFrom] = useState<string>('')
  const [selectedTo, setSelectedTo] = useState<string>('')
  const [selectedRanges, setSelectedRanges] = useState<string[]>([])
  const [includeActive, setIncludeActive] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentRange, setCurrentRange] = useState<string>('')

  if (!isOpen) return null

  const handleToggleRange = (label: string) => {
    setSelectedRanges(prev =>
      prev.includes(label)
        ? prev.filter(r => r !== label)
        : [...prev, label]
    )
  }

  const handleSelectAll = () => {
    if (selectedRanges.length === availableRanges.length) {
      setSelectedRanges([])
    } else {
      setSelectedRanges(availableRanges.map(r => r.label))
    }
  }

  const handleFromChange = (key: string) => {
    setSelectedFrom(key)
    if (!selectedTo || key > selectedTo) {
      setSelectedTo(key)
    }
  }

  const handleGenerate = async () => {
    if (!selectedFrom || !selectedTo) {
      toast.error('Seleccioná el período Desde y Hasta')
      return
    }

    if (selectedRanges.length === 0) {
      toast.error('Seleccioná al menos un rango de territorios')
      return
    }

    const { year: fromYear, month: fromMonth } = parseKey(selectedFrom)
    const { year: toYear, month: toMonth } = parseKey(selectedTo)

    setIsGenerating(true)
    onExportingChange(true)

    try {
      for (const rangeLabel of selectedRanges) {
        const [startStr, endStr] = rangeLabel.split('-')
        const start = parseInt(startStr)
        const end = parseInt(endStr)

        setCurrentRange(rangeLabel)

        const result = await exportTerritoryHistoryPdf(
          start, end,
          fromMonth, fromYear,
          toMonth, toYear,
          includeActive
        )

        if (!result.success || !result.data || !result.filename) {
          toast.error(result.message || 'Error al generar PDF')
          continue
        }

        downloadPdf(result.data, result.filename)
        toast.success(`PDF generado: Territorios ${rangeLabel}`)
      }

      toast.success(`¡${selectedRanges.length} PDF(s) generado(s) correctamente!`)
      onClose()
    } catch (error) {
      console.error('Error al generar PDFs:', error)
      toast.error('Error al generar los PDFs')
    } finally {
      setIsGenerating(false)
      onExportingChange(false)
      setCurrentRange('')
    }
  }

  const downloadPdf = (pdfData: Uint8Array, filename: string) => {
    const blob = new Blob([pdfData as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPeriodLabel = () => {
    if (!selectedFrom || !selectedTo) return ''
    const { year: fromY, month: fromM } = parseKey(selectedFrom)
    const { year: toY, month: toM } = parseKey(selectedTo)
    return `${MONTH_NAMES[fromM - 1]} ${fromY} → ${MONTH_NAMES[toM - 1]} ${toY}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isGenerating && onClose()} />

      <div className="relative bg-[#0F1729] rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <FileDown className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Exportar a PDF</h2>
              <p className="text-sm text-slate-400">Formato S-13-S · Registro de asignación de territorio</p>
            </div>
          </div>
          <button
            onClick={() => !isGenerating && onClose()}
            disabled={isGenerating}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Selectores de período */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <Calendar className="h-4 w-4 inline mr-1.5" />
            Período
          </label>

          <div className="flex items-start gap-2">
            {/* Desde */}
            <div className="flex-1">
              <MonthPicker
                value={selectedFrom}
                onChange={handleFromChange}
                disabled={isGenerating}
                label="Desde"
              />
            </div>

            {/* Separador */}
            <div className="pt-9 px-1">
              <ArrowRight className="h-5 w-5 text-slate-500" />
            </div>

            {/* Hasta */}
            <div className="flex-1">
              <MonthPicker
                value={selectedTo}
                onChange={setSelectedTo}
                minKey={selectedFrom || undefined}
                disabled={isGenerating}
                label="Hasta"
              />
            </div>
          </div>

          {/* Indicador del período seleccionado */}
          {selectedFrom && selectedTo && (
            <p className="text-xs text-green-400 mt-2 text-center">
              {getPeriodLabel()}
            </p>
          )}
        </div>

        {/* Lista de rangos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">
              <MapPin className="h-4 w-4 inline mr-1.5" />
              Rangos de Territorios
            </label>
            <button
              onClick={handleSelectAll}
              disabled={isGenerating}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              {selectedRanges.length === availableRanges.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {availableRanges.map(range => (
              <label
                key={range.label}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRanges.includes(range.label)
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedRanges.includes(range.label)}
                  onChange={() => handleToggleRange(range.label)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500 disabled:opacity-50"
                />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium text-slate-200">
                    Territorios {range.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {range.count} {range.count === 1 ? 'territorio' : 'territorios'}
                  </span>
                </div>
              </label>
            ))}

            {availableRanges.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No hay territorios disponibles para exportar
              </p>
            )}
          </div>
        </div>

        {/* Checkbox incluir activas */}
        <div className="mb-6">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={includeActive}
              onChange={(e) => setIncludeActive(e.target.checked)}
              disabled={isGenerating}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
            />
            <div>
              <span className="text-sm font-medium text-slate-200">Incluir asignaciones activas</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Agrega las asignaciones que están en curso (sin fecha de devolución)
              </p>
            </div>
          </label>
        </div>

        {/* Estado de generación */}
        {isGenerating && currentRange && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Generando PDF...</p>
              <p className="text-xs text-blue-400/70">Territorios {currentRange}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedFrom || !selectedTo || selectedRanges.length === 0 || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5" />
                <span>
                  {selectedFrom && selectedTo
                    ? `Generar ${selectedRanges.length} PDF(s)`
                    : 'Generar PDF'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
