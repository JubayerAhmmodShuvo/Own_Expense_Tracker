import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Note from '@/models/Note'
import { z } from 'zod'

const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters'),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id?: string } }
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    const isPinned = searchParams.get('pinned') === 'true'

    // Build query
    const query: Record<string, unknown> = { userId }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]
    }

    if (tag) {
      query.tags = { $in: [tag] }
    }

    if (isPinned) {
      query.isPinned = true
    }

    // Get notes, sorted by pinned first, then by creation date
    const notes = await Note.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .lean()

    const transformedNotes = notes.map((note: Record<string, unknown>) => ({
      id: (note._id as { toString(): string }).toString(),
      title: note.title as string,
      content: note.content as string,
      tags: (note.tags as string[]) || [],
      isPinned: (note.isPinned as boolean) || false,
      color: (note.color as string) || '#FFFFFF',
      userId: note.userId as string,
      createdAt: note.createdAt as Date,
      updatedAt: note.updatedAt as Date,
    }))

    return NextResponse.json(transformedNotes)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id?: string } }
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    const note = await Note.create({
      ...validatedData,
      userId,
      tags: validatedData.tags || [],
      isPinned: validatedData.isPinned || false,
      color: validatedData.color || '#FFFFFF',
    })

    const transformedNote = {
      id: note._id.toString(),
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      isPinned: note.isPinned || false,
      color: note.color || '#FFFFFF',
      userId: note.userId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }

    return NextResponse.json(transformedNote, { status: 201 })
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
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

