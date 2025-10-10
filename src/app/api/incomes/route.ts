import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Income from '@/models/Income'
import { z } from 'zod'

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  source: z.string().optional(),
  date: z.string().optional(), // Accept any string format, we'll parse it
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

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalCount = await Income.countDocuments(filter)

    // Get paginated results
    const incomes = await Income.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    // Transform the data to match the expected format
    const transformedIncomes = incomes.map(income => ({
      id: income._id.toString(),
      amount: income.amount,
      description: income.description,
      source: income.source,
      date: income.date,
      userId: income.userId,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    }))

    return NextResponse.json({
      data: transformedIncomes,
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
    console.error('Get incomes error:', error)
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
    const { amount, description, source, date } = incomeSchema.parse(body)

    // Parse date - handle both YYYY-MM-DD and ISO datetime formats
    let incomeDate = new Date()
    if (date) {
      // If it's just a date (YYYY-MM-DD), add time to make it valid
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        incomeDate = new Date(date + 'T00:00:00.000Z')
      } else {
        incomeDate = new Date(date)
      }
    }

    const income = await Income.create({
      amount,
      description,
      source,
      date: incomeDate,
      userId,
    })

    // Transform the data to match the expected format
    const transformedIncome = {
      id: income._id.toString(),
      amount: income.amount,
      description: income.description,
      source: income.source,
      date: income.date,
      userId: income.userId,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    }

    return NextResponse.json(transformedIncome, { status: 201 })
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

    console.error('Create income error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
