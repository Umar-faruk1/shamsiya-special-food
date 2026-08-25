import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'shamsiya_session'

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get(SESSION_COOKIE)?.value === 'authenticated'

  if (request.nextUrl.pathname === '/login') {
    return isAuthenticated
      ? NextResponse.redirect(new URL('/dashboard', request.url))
      : NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}