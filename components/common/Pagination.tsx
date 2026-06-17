'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const PAGE_SIZES = [10, 20, 50] as const

export function Pagination({ page, pageSize, total, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createUrl = useCallback((p: number, ps: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    params.set('pageSize', ps.toString())
    return `${pathname}?${params.toString()}`
  }, [pathname, searchParams])

  if (total <= 0) return null

  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)

  const goTo = (p: number) => {
    router.push(createUrl(p, pageSize))
  }

  const changePageSize = (ps: number) => {
    router.push(createUrl(1, ps))
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800">
      {/* Info */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>
          <span className="font-medium text-slate-300">{from}</span>
          {' — '}
          <span className="font-medium text-slate-300">{to}</span>
          {' de '}
          <span className="font-medium text-white">{total}</span>
          {' registros'}
        </span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none cursor-pointer"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center gap-1">
          {/* Primera página */}
          <button
            onClick={() => goTo(1)}
            disabled={page <= 1}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Anterior */}
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Indicador de página actual */}
          <span className="min-w-[80px] text-center text-sm text-slate-300">
            Pág. <span className="font-medium text-white">{page}</span> de{' '}
            <span className="font-medium text-white">{totalPages}</span>
          </span>

          {/* Siguiente */}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Última página */}
          <button
            onClick={() => goTo(totalPages)}
            disabled={page >= totalPages}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
