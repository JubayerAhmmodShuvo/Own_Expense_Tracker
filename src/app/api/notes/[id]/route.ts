import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Note from '@/models/Note'
import { z } from 'zod'

const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters').optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  color: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth() as { user?: { id?: string } }
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const note = await Note.findOne({
      _id: id,
      userId,
    })

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

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

    return NextResponse.json(transformedNote)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth() as { user?: { id?: string } }
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    const body = await request.json()
    const updateData = updateNoteSchema.parse(body)

    // Check if note exists and belongs to user
    const existingNote = await Note.findOne({
      _id: id,
      userId,
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const updateFields: Record<string, unknown> = {}
    if (updateData.title !== undefined) updateFields.title = updateData.title
    if (updateData.content !== undefined) updateFields.content = updateData.content
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags
    if (updateData.isPinned !== undefined) updateFields.isPinned = updateData.isPinned
    if (updateData.color !== undefined) updateFields.color = updateData.color

    const note = await Note.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

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

    return NextResponse.json(transformedNote)
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

    console.error('Update note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth() as { user?: { id?: string } }
    const userId = session.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id } = await params

    // Check if note exists and belongs to user
    const existingNote = await Note.findOne({
      _id: id,
      userId,
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await Note.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete note error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

