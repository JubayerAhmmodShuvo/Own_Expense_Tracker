import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function getUserId(): Promise<string | null> {
  // @ts-expect-error - NextAuth v4 type compatibility issue
  const session = await getServerSession(authOptions)
  return (session?.user as { id?: string })?.id || null
}

export async function requireAuth() {
  // @ts-expect-error - NextAuth v4 type compatibility issue
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
      // console.log('requireAuth - Raw session:', session)
      // console.log('requireAuth - Session user:', session.user)
  
  return session
}
