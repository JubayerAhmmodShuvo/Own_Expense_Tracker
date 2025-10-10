import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import { z } from 'zod'

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.string().optional(), // Accept any string format, we'll parse it
  categoryId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const filter: Record<string, unknown> = {
      userId,
    }

    // Handle date filtering based on period or custom date range
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else if (period && period !== 'custom') {
      const now = new Date()
      let dateFilter: Record<string, Date> = {}
      
      switch (period) {
        case 'day':
          dateFilter = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          }
          break
        case 'week':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          dateFilter = { $gte: startOfWeek, $lte: endOfWeek }
          break
        case 'month':
          dateFilter = {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          }
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          dateFilter = {
            $gte: new Date(now.getFullYear(), quarter * 3, 1),
            $lte: new Date(now.getFullYear(), quarter * 3 + 3, 0),
          }
          break
        case 'year':
          dateFilter = {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: new Date(now.getFullYear(), 11, 31),
          }
          break
      }
      
      if (Object.keys(dateFilter).length > 0) {
        filter.date = dateFilter
      }
    }

    if (categoryId) {
      filter.categoryId = categoryId
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await Expense.countDocuments(filter)

    // Get paginated results
    const expenses = await Expense.find(filter)
      .populate('categoryId', 'name color')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    // Transform the data to match the expected format
    const transformedExpenses = expenses.map(expense => ({
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
    }))

    return NextResponse.json({
      data: transformedExpenses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get expenses error:', error)
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
    // console.log('Expense API received data:', body)
    const { amount, description, date, categoryId } = expenseSchema.parse(body)

    // Parse date - handle both YYYY-MM-DD and ISO datetime formats
    let expenseDate = new Date()
    if (date) {
      // If it's just a date (YYYY-MM-DD), add time to make it valid
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        expenseDate = new Date(date + 'T00:00:00.000Z')
      } else {
        expenseDate = new Date(date)
      }
    }

    const expense = await Expense.create({
      amount,
      description,
      date: expenseDate,
      categoryId: categoryId || null,
      userId,
    })

    // Populate the category if it exists
    if (categoryId) {
      await expense.populate('categoryId', 'name color')
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

    return NextResponse.json(transformedExpense, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      console.error('Expense validation error:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
