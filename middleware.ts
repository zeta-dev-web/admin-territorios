import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

const publicRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  // Obtener la sesión
  const cookie = request.cookies.get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  // Redirigir a login si no está autenticado y trata de acceder a ruta protegida
  if (!isPublicRoute && !session?.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  // Redirigir a dashboard si está autenticado y trata de acceder a login
  if (isPublicRoute && session?.isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
