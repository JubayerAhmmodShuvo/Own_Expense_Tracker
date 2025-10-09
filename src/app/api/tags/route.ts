import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Tag from '@/models/Tag'
import { z } from 'zod'

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().optional(),
})

export async function GET() {
  try {
    const userId = await requireAuth()
    await connectDB()

    const tags = await Tag.find({
      userId,
    }).sort({ name: 1 })

    // Transform the data to match the expected format
    const transformedTags = tags.map(tag => ({
      id: tag._id.toString(),
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }))

    return NextResponse.json(transformedTags)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get tags error:', error)
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
    const { name, color } = tagSchema.parse(body)

    const tag = await Tag.create({
      name,
      color: color || '#6B7280',
      userId,
    })

    // Transform the data to match the expected format
    const transformedTag = {
      id: tag._id.toString(),
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }

    return NextResponse.json(transformedTag, { status: 201 })
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

    console.error('Create tag error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
