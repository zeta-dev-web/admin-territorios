'use client'

import { CheckCircle2, Calendar, User, FileText } from 'lucide-react'
import { formatDate, formatDateShort } from '@/lib/utils'

interface DailyRecord {
  id: string
  date: Date
  notes?: string | null
  block: {
    letter: string
  }
  driver: {
    name: string
  }
}

interface DailyRecordsTimelineProps {
  records: DailyRecord[]
}

export function DailyRecordsTimeline({ records }: DailyRecordsTimelineProps) {
  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <div key={record.id} className="relative">
          {/* Línea de conexión (excepto el último) */}
          {index !== records.length - 1 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-800" />
          )}

          {/* Tarjeta de registro */}
          <div className="flex gap-4">
            {/* Indicador circular */}
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-full border-4 border-[#0F1729] shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">
                    Manzana {record.block.letter}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateShort(record.date)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                  <User className="h-3.5 w-3.5" />
                  <span>{record.driver.name}</span>
                </div>
              </div>

              {record.notes && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex items-start gap-2 text-sm text-slate-400">
                    <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p className="flex-1">{record.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
