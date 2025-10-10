import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes - let the page components handle auth checks
  // This middleware just ensures the route exists
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/setup') {
    // Allow the request to proceed - auth will be checked in the page component
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}