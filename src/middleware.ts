import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and API routes
        if (req.nextUrl.pathname.startsWith('/auth/') || 
            req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true
        }
        
        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/expenses/:path*',
    '/api/incomes/:path*',
    '/api/categories/:path*',
    '/api/analytics/:path*',
  ]
}
