import { NextRequest, NextResponse } from 'next/server'
import { authorizeModuleRequest } from '@/lib/module-access'
import { scrapeWeekProgram } from '@/modules/scraper/wol-scraper'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/vymc/scraper/preview - Vista previa del programa desde WOL
export async function POST(request: NextRequest) {
  try {
    const access = await authorizeModuleRequest('VYMC')
    if ('response' in access) return access.response
    const { weekNumber, year } = await request.json()
    if (!weekNumber || !year) {
      return NextResponse.json({ error: 'weekNumber y year son requeridos' }, { status: 400 })
    }
    const result = await scrapeWeekProgram(Number(weekNumber), Number(year))
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    return NextResponse.json(result.data)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error en scraper preview:', error)
    return NextResponse.json({ error: 'Error al obtener programa' }, { status: 500 })
  }
}
