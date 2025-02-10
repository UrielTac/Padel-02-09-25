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
  '/admin/auth/error',
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

// Función para obtener empresa_id desde diferentes fuentes
async function getEmpresaId(req: NextRequest, session: any, supabase: any) {
  // 1. Intentar obtener de los metadatos del usuario
  const empresaIdFromMeta = session?.user?.app_metadata?.empresa_id || session?.user?.user_metadata?.empresa_id
  if (empresaIdFromMeta) {
    console.log('Middleware: Empresa ID encontrada en metadatos:', empresaIdFromMeta)
    return empresaIdFromMeta
  }

  // 2. Intentar obtener de las cookies
  const empresaIdFromCookie = req.cookies.get('empresa_id')?.value
  if (empresaIdFromCookie) {
    console.log('Middleware: Empresa ID encontrada en cookie:', empresaIdFromCookie)
    return empresaIdFromCookie
  }

  // 3. Si no hay cookie, buscar en la base de datos
  console.log('Middleware: Buscando empresa en base de datos para usuario:', session.user.id)
  
  // Primero buscar en empresas directamente
  const { data: empresaData } = await supabase
    .from('empresas')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .single()

  if (empresaData?.id) {
    console.log('Middleware: Empresa encontrada directamente:', empresaData.id)
    await persistEmpresaId(empresaData.id, session, supabase)
    return empresaData.id
  }

  // Si no se encuentra, buscar en vinculaciones
  const { data: vinculacionData } = await supabase
    .from('vinculaciones')
    .select('empresa_id')
    .eq('user_id', session.user.id)
    .eq('estado', 'activo')
    .single()

  if (vinculacionData?.empresa_id) {
    console.log('Middleware: Empresa encontrada en vinculaciones:', vinculacionData.empresa_id)
    await persistEmpresaId(vinculacionData.empresa_id, session, supabase)
    return vinculacionData.empresa_id
  }

  return null
}

// Función para persistir el empresa_id
async function persistEmpresaId(empresaId: string, session: any, supabase: any) {
  // 1. Actualizar metadatos del usuario
  await supabase.auth.updateUser({
    data: { empresa_id: empresaId }
  })

  // 2. Devolver la respuesta con la cookie actualizada
  const response = NextResponse.next()
  response.cookies.set('empresa_id', empresaId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 días
  })
  
  return response
}

// Middleware principal
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ]
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Permitir acceso a rutas públicas
  const publicRoutes = [
    '/admin/login',
    '/admin/auth/callback' // Añadir ruta de callback
  ]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  if (isStaticAsset(pathname) || isPublicRoute(pathname)) {
    return res
  }

  try {
    const supabase = createMiddlewareClient<Database>({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    const userRole = session?.user?.app_metadata?.role || 'client'

    console.log('Middleware - Verificación de sesión:', {
      hasSession: !!session,
      userRole,
      pathname,
      userId: session?.user?.id
    })

    // Verificar acceso según el rol y la ruta
    if (pathname.startsWith('/admin')) {
      if (!session) {
        console.log('Middleware: No hay sesión, redirigiendo a login')
        return NextResponse.redirect(new URL('/admin/login?returnUrl=' + pathname, req.url))
      }

      if (userRole !== 'admin' && userRole !== 'superadmin') {
        console.log('Middleware: Usuario sin rol admin')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }

      // Verificar empresa_id para rutas específicas
      if (pathname.includes('/dashboard/forms-a/')) {
        const empresaId = await getEmpresaId(req, session, supabase)
        
        if (!empresaId) {
          console.log('Middleware: No se encontró empresa asociada al usuario')
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }

        // Actualizar la respuesta con la cookie
        const response = await persistEmpresaId(empresaId, session, supabase)
        return response
      }
    }

    // Redirigir /dashboard a /admin/dashboard
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL(pathname.replace('/dashboard', '/admin/dashboard'), req.url))
    }

    return res
  } catch (error) {
    console.error('Error en middleware:', error)
    return NextResponse.redirect(new URL('/error', req.url))
  }
} 