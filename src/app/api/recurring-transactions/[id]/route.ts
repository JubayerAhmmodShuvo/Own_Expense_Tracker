import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import RecurringTransaction from '@/models/RecurringTransaction'
import { z } from 'zod'

const recurringTransactionUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  type: z.enum(['expense', 'income']).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Helper function to calculate next due date
function calculateNextDueDate(startDate: Date, frequency: string): Date {
  const nextDate = new Date(startDate)
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }
  
  return nextDate
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const recurringTransaction = await RecurringTransaction.findOne({
      _id: params.id,
      userId,
    }).populate('categoryId', 'name color')

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedTransaction = {
      id: recurringTransaction._id.toString(),
      name: recurringTransaction.name,
      amount: recurringTransaction.amount,
      description: recurringTransaction.description,
      type: recurringTransaction.type,
      frequency: recurringTransaction.frequency,
      categoryId: recurringTransaction.categoryId?._id?.toString() || null,
      source: recurringTransaction.source,
      startDate: recurringTransaction.startDate,
      endDate: recurringTransaction.endDate,
      nextDueDate: recurringTransaction.nextDueDate,
      isActive: recurringTransaction.isActive,
      userId: recurringTransaction.userId,
      createdAt: recurringTransaction.createdAt,
      updatedAt: recurringTransaction.updatedAt,
      category: recurringTransaction.categoryId ? {
        id: recurringTransaction.categoryId._id.toString(),
        name: recurringTransaction.categoryId.name,
        color: recurringTransaction.categoryId.color,
      } : null,
    }

    return NextResponse.json(transformedTransaction)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get recurring transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const updateData = recurringTransactionUpdateSchema.parse(body)

    // If frequency or startDate is being updated, recalculate nextDueDate
    if (updateData.frequency || updateData.startDate) {
      const existingTransaction = await RecurringTransaction.findById(params.id)
      if (existingTransaction) {
        const frequency = updateData.frequency || existingTransaction.frequency
        const startDate = updateData.startDate ? new Date(updateData.startDate) : existingTransaction.startDate
        updateData.nextDueDate = calculateNextDueDate(startDate, frequency)
      }
    }

    const recurringTransaction = await RecurringTransaction.findOneAndUpdate(
      { _id: params.id, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color')

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedTransaction = {
      id: recurringTransaction._id.toString(),
      name: recurringTransaction.name,
      amount: recurringTransaction.amount,
      description: recurringTransaction.description,
      type: recurringTransaction.type,
      frequency: recurringTransaction.frequency,
      categoryId: recurringTransaction.categoryId?._id?.toString() || null,
      source: recurringTransaction.source,
      startDate: recurringTransaction.startDate,
      endDate: recurringTransaction.endDate,
      nextDueDate: recurringTransaction.nextDueDate,
      isActive: recurringTransaction.isActive,
      userId: recurringTransaction.userId,
      createdAt: recurringTransaction.createdAt,
      updatedAt: recurringTransaction.updatedAt,
      category: recurringTransaction.categoryId ? {
        id: recurringTransaction.categoryId._id.toString(),
        name: recurringTransaction.categoryId.name,
        color: recurringTransaction.categoryId.color,
      } : null,
    }

    return NextResponse.json(transformedTransaction)
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

    console.error('Update recurring transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const recurringTransaction = await RecurringTransaction.findOneAndDelete({
      _id: params.id,
      userId,
    })

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Recurring transaction deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete recurring transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
