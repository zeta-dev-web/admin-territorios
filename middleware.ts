import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth-middleware'

const publicRoutes = ['/login']
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Las rutas /api/* no pasan por este middleware
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.includes(path)
  const isAuthRoute = authRoutes.includes(path)

  // Obtener la sesión
  const cookie = request.cookies.get('session')?.value
  const session = cookie ? await decrypt(cookie) : null

  // El admin/setup es accesible sin autenticación (primera vez)
  if (path === '/api/setup') {
    return NextResponse.next()
  }

  // Redirigir a login si no está autenticado
  if (!isPublicRoute && !session?.isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  // Redirigir a dashboard si ya está autenticado y va a login
  if (isAuthRoute && session?.isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  // Proteger /admin/users — solo ADMIN puede gestionar usuarios
  if (path === '/admin/users' && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image.png|twitter-image.png|manifest.webmanifest|brand/|tutorial/|mapas/).*)',
  ],
}
