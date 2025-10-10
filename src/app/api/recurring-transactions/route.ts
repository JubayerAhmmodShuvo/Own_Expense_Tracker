import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import RecurringTransaction from '@/models/RecurringTransaction'
import { z } from 'zod'

const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  type: z.enum(['expense', 'income']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
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

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'expense' or 'income'
    const isActive = searchParams.get('isActive')

    const filter: Record<string, unknown> = { userId }
    
    if (type) {
      filter.type = type
    }
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true'
    }

    const recurringTransactions = await RecurringTransaction.find(filter)
      .populate('categoryId', 'name color')
      .sort({ nextDueDate: 1 })

    // Transform the data to match the expected format
    const transformedTransactions = recurringTransactions.map(transaction => ({
      id: transaction._id.toString(),
      name: transaction.name,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      frequency: transaction.frequency,
      categoryId: transaction.categoryId?._id?.toString() || null,
      source: transaction.source,
      startDate: transaction.startDate,
      endDate: transaction.endDate,
      nextDueDate: transaction.nextDueDate,
      isActive: transaction.isActive,
      userId: transaction.userId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      category: transaction.categoryId ? {
        id: transaction.categoryId._id.toString(),
        name: transaction.categoryId.name,
        color: transaction.categoryId.color,
      } : null,
    }))

    return NextResponse.json(transformedTransactions)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get recurring transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const body = await request.json()
    const { name, amount, description, type, frequency, categoryId, source, startDate, endDate } = recurringTransactionSchema.parse(body)

    // Parse dates
    const startDateObj = new Date(startDate)
    const endDateObj = endDate ? new Date(endDate) : undefined
    const nextDueDate = calculateNextDueDate(startDateObj, frequency)

    const recurringTransaction = await RecurringTransaction.create({
      name,
      amount,
      description,
      type,
      frequency,
      categoryId: categoryId || null,
      source: source || null,
      startDate: startDateObj,
      endDate: endDateObj,
      nextDueDate,
      userId,
    })

    // Populate the category if it exists
    if (categoryId) {
      await recurringTransaction.populate('categoryId', 'name color')
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

    return NextResponse.json(transformedTransaction, { status: 201 })
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

    console.error('Create recurring transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
