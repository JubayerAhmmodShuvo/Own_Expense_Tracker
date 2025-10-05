import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Category from '@/models/Category'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      // Check if it's an OAuth account (no password)
      if (!existingUser.password || existingUser.password.trim() === '') {
        return NextResponse.json(
          { error: 'An account with this email already exists using Google sign-in. Please use Google sign-in instead.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    // Create default categories
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
        userId: user._id.toString(),
      }))
    )

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
