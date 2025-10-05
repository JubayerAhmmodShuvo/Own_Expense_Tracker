import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
})

export async function GET() {
  try {
    const userId = await requireAuth()
    await connectDB()

    const categories = await Category.find({
      userId,
    }).sort({ name: 1 })

    // Transform the data to match the expected format
    const transformedCategories = categories.map(category => ({
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      color: category.color,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))

    return NextResponse.json(transformedCategories)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const { name, description, color } = categorySchema.parse(body)

    const category = await Category.create({
      name,
      description,
      color: color || '#3B82F6',
      userId,
    })

    // Transform the data to match the expected format
    const transformedCategory = {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      color: category.color,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }

    return NextResponse.json(transformedCategory, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
