import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Category from '@/models/Category'
import { Session } from 'next-auth'

/* eslint-disable @typescript-eslint/no-explicit-any */
type NextAuthOptions = {
  providers: unknown[]
  session: { strategy: string }
  callbacks: Record<string, unknown>
  pages: { signIn: string }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const user = await User.findOne({
          email: credentials.email
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
        async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          
          // Check if user exists
          const existingUser = await User.findOne({ email: user.email })
          
          if (existingUser) {
            // If user exists with a password (manual account), prevent OAuth sign-in
            if (existingUser.password && existingUser.password.trim() !== '') {
              console.log('User already exists with manual account, preventing OAuth sign-in')
              return false
            }
            // If user exists without password (OAuth account), allow sign-in
            return true
          }
          
          // Create new user for Google OAuth
          const newUser = await User.create({
            name: user.name || '',
            email: user.email || '',
            password: '', // No password for OAuth users
          })

          // Create default categories for new Google user
          const defaultCategories = [
            { name: 'Food & Dining', color: '#EF4444' },
            { name: 'Transportation', color: '#3B82F6' },
            { name: 'Shopping', color: '#10B981' },
            { name: 'Entertainment', color: '#F59E0B' },
            { name: 'Bills & Utilities', color: '#8B5CF6' },
            { name: 'Healthcare', color: '#EC4899' },
            { name: 'Education', color: '#06B6D4' },
            { name: 'Other', color: '#6B7280' },
          ]

          await Category.insertMany(
            defaultCategories.map(category => ({
              ...category,
              userId: newUser._id.toString(),
            }))
          )
          
          return true
        } catch (error) {
          console.error('Google OAuth sign in error:', error)
          return false
        }
      }
      return true
    },
        async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (user) {
        token.id = user.id
      }
      
      // For Google OAuth, get user ID from database
      if (account?.provider === 'google' && user?.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: user.email })
          if (dbUser) {
            token.id = dbUser._id.toString()
          }
        } catch (error) {
          console.error('Error getting user ID for Google OAuth:', error)
        }
      }
      
      return token
    },
        async session({ session, token }: { session: Session; token: any }): Promise<Session> {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}
