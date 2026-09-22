import { NextRequest, NextResponse } from 'next/server'
import { getUnassignedTerritories } from '@/server/territories'

export const dynamic = 'force-dynamic'

// GET /api/territorios/unassigned?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Sin params: devuelve los territorios que NUNCA fueron asignados.
// Con desde/hasta (opcionales, uno o ambos): los que NO tuvieron ninguna
// asignación (conductor ni personal) iniciada en ese periodo.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde') ?? searchParams.get('from') ?? undefined
    const hasta = searchParams.get('hasta') ?? searchParams.get('to') ?? undefined

    const result = await getUnassignedTerritories({
      desde: desde ?? undefined,
      hasta: hasta ?? undefined,
    })

    if (!result.success) {
      const status = result.message?.includes('No autenticado') ? 401 : 400
      return NextResponse.json({ error: result.message }, { status })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener territorios no asignados' }, { status: 500 })
  }
}
