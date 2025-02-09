import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/auth/callback',
  '/unauthorized',
  '/admin/login',
  '/admin/auth/callback',
  '/clases/login'
] as const

// Rutas de assets estáticos
const STATIC_ROUTES = [
  '/_next',
  '/static',
  '/favicon.ico'
] as const

// Funciones auxiliares
function isStaticAsset(pathname: string): boolean {
  return STATIC_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route)
}

// Middleware principal
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Permitir acceso a assets estáticos
  if (isStaticAsset(pathname)) {
    return res
  }

  // Permitir acceso a rutas públicas específicas
  if (isPublicRoute(pathname)) {
    return res
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Obtener el rol del usuario desde app_metadata
    const userRole = session?.user?.app_metadata?.role || 'client'
    const empresaId = session?.user?.app_metadata?.empresa_id

    // Verificar acceso según el rol y la ruta
    if (pathname.startsWith('/admin')) {
      // Si no hay sesión o el rol no es admin, redirigir a login de admin
      if (!session || userRole !== 'admin') {
        console.log('Middleware: Acceso denegado a ruta admin:', {
          session: !!session,
          role: userRole,
          path: pathname
        })
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Verificar acceso a rutas de formularios
    if (pathname.startsWith('/dashboard/forms')) {
      if (!session) {
        console.log('Middleware: No hay sesión para forms, redirigiendo a login')
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      if (!empresaId) {
        console.log('Middleware: Usuario sin empresa asignada')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }

      // Verificar permisos específicos para formularios si es necesario
      if (userRole !== 'admin' && !session.user?.app_metadata?.can_manage_forms) {
        console.log('Middleware: Usuario sin permisos para gestionar formularios')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Verificar acceso a rutas de clases
    if (pathname.startsWith('/clases/')) {
      // Permitir acceso a la página de login sin autenticación
      if (pathname === '/clases/login') {
        return res
      }

      // Si no hay sesión, redirigir al login de clases con returnUrl
      if (!session) {
        console.log('Middleware: No hay sesión, redirigiendo a login con returnUrl:', pathname)
        const redirectUrl = new URL('/clases/login', req.url)
        redirectUrl.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Si hay una sesión válida y estamos en una ruta protegida, permitir el acceso
      return res
    }

    return res
  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/error', req.url))
  }
}

// Configurar las rutas que deben ser manejadas por el middleware
export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/clases/:path*'
  ]
} 