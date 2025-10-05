import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  categoryId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    const expense = await Expense.findOne({
      _id: id,
      userId,
    }).populate('categoryId', 'name color')

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedExpense = {
      id: expense._id.toString(),
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      categoryId: expense.categoryId?._id?.toString() || null,
      userId: expense.userId,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      category: expense.categoryId ? {
        id: expense.categoryId._id.toString(),
        name: expense.categoryId.name,
        color: expense.categoryId.color,
      } : null,
    }

    return NextResponse.json(transformedExpense)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get expense error:', error)
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
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    const body = await request.json()
    const updateData = updateExpenseSchema.parse(body)

    // Check if expense exists and belongs to user
    const existingExpense = await Expense.findOne({
      _id: id,
      userId,
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateFields: Record<string, unknown> = {}
    if (updateData.amount !== undefined) updateFields.amount = updateData.amount
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.date !== undefined) updateFields.date = new Date(updateData.date)
    if (updateData.categoryId !== undefined) updateFields.categoryId = updateData.categoryId || null

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).populate('categoryId', 'name color')

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedExpense = {
      id: expense._id.toString(),
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      categoryId: expense.categoryId?._id?.toString() || null,
      userId: expense.userId,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      category: expense.categoryId ? {
        id: expense.categoryId._id.toString(),
        name: expense.categoryId.name,
        color: expense.categoryId.color,
      } : null,
    }

    return NextResponse.json(transformedExpense)
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

    console.error('Update expense error:', error)
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
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    // Check if expense exists and belongs to user
    const existingExpense = await Expense.findOne({
      _id: id,
      userId,
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await Expense.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
