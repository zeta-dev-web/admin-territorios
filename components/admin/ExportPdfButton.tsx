'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={availableRanges.length === 0}
        title={availableRanges.length === 0 ? 'No hay territorios para exportar' : 'Exportar a PDF'}
        className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/20 hover:from-green-600 hover:to-emerald-700"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <FileDown className="h-5 w-5" />
            <span>Descargar</span>
          </>
        )}
      </Button>

      <ExportRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableRanges={availableRanges}
        onExportingChange={setIsExporting}
      />
    </>
  )
}
