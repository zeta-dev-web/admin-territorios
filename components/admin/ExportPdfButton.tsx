'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { ExportRangeModal } from './ExportRangeModal'
import type { TerritoryRange } from '@/types'

interface ExportPdfButtonProps {
  availableRanges: TerritoryRange[]
}

export function ExportPdfButton({ availableRanges }: ExportPdfButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={availableRanges.length === 0}
        title={availableRanges.length === 0 ? 'No hay territorios para exportar' : 'Exportar a PDF'}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 disabled:from-slate-700 disabled:to-slate-800 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FileDown className="h-5 w-5" />
            <span>Exportar a PDF</span>
          </>
        )}
      </button>

      <ExportRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableRanges={availableRanges}
        onExportingChange={setIsExporting}
      />
    </>
  )
}
