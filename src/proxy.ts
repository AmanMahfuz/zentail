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
  
  if (!user) {
    // If not logged in, only allow public/auth routes
    const isProtectedRoute = pathname.startsWith('/dashboard') || 
                             pathname.startsWith('/onboarding') ||
                             pathname.startsWith('/applications')
    if (isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      return NextResponse.redirect(url)
    }
  } else {
    // User is logged in
    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const isOnboarded = profile?.onboarding_completed === true

    const isAuthRoute = pathname.startsWith('/signin') || pathname.startsWith('/signup')
    const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/applications')
    const isOnboardingRoute = pathname.startsWith('/onboarding')

    if (isAuthRoute) {
      // Logged in users shouldn't see auth pages
      const url = request.nextUrl.clone()
      url.pathname = isOnboarded ? '/dashboard' : '/onboarding'
      return NextResponse.redirect(url)
    }

    if (!isOnboarded && isDashboardRoute) {
      // Must onboard first
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    if (isOnboarded && isOnboardingRoute) {
      // Already onboarded
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

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
