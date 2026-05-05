import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return supabaseResponse

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/about', '/privacy', '/terms', '/cookies']
  const isPublic = publicRoutes.some(r => pathname === r) || pathname.startsWith('/api/') || pathname.startsWith('/auth/') || pathname.startsWith('/_next/')

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    if (['/login', '/register'].includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile && !profile.onboarding_complete && pathname !== '/onboarding' && !isPublic) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (pathname.startsWith('/recruiter') && profile?.user_type !== 'recruiter') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/seeker') && profile?.user_type !== 'job_seeker') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
