import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow static assets, api routes, etc. handled by matcher
  const isLandingRoute = pathname === '/' || pathname === ''
  const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup')
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/applications') ||
                           pathname.startsWith('/onboarding') ||
                           pathname.startsWith('/resumes') ||
                           pathname.startsWith('/interviews') ||
                           pathname.startsWith('/jobs') ||
                           pathname.startsWith('/settings') ||
                           pathname.startsWith('/profile') ||
                           pathname.startsWith('/network') ||
                           pathname.startsWith('/skills') ||
                           pathname.startsWith('/analytics') ||
                           pathname.startsWith('/billing') ||
                           pathname.startsWith('/linkedin')

  if (!user) {
    // If not logged in, redirect to signin for protected routes
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      return NextResponse.redirect(url)
    }
  } else {
    // User is logged in — don't show landing page or auth screens, go directly to dashboard
    if (isLandingRoute || isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export { proxy }

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
