import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Budget from '@/models/Budget'
import Expense from '@/models/Expense'
import { z } from 'zod'

const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  categoryId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const includeProgress = searchParams.get('includeProgress') === 'true'

    const budgets = await Budget.find({
      userId,
      isActive: true,
    }).populate('categoryId', 'name color').sort({ createdAt: -1 })

    // Transform the data to match the expected format
    let transformedBudgets = budgets.map(budget => ({
      id: budget._id.toString(),
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.categoryId?._id?.toString() || null,
      userId: budget.userId,
      isActive: budget.isActive,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      category: budget.categoryId ? {
        id: budget.categoryId._id.toString(),
        name: budget.categoryId.name,
        color: budget.categoryId.color,
      } : null,
    }))

    // If progress is requested, calculate spending for each budget
    if (includeProgress) {
      const budgetsWithProgress = await Promise.all(
        transformedBudgets.map(async (budget) => {
          const now = new Date()
          let dateFilter: Record<string, Date> = {}

          // Calculate date range based on budget period
          switch (budget.period) {
            case 'weekly':
              const startOfWeek = new Date(now)
              startOfWeek.setDate(now.getDate() - now.getDay())
              const endOfWeek = new Date(startOfWeek)
              endOfWeek.setDate(startOfWeek.getDate() + 6)
              dateFilter = { $gte: startOfWeek, $lte: endOfWeek }
              break
            case 'monthly':
              dateFilter = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
              }
              break
            case 'yearly':
              dateFilter = {
                $gte: new Date(now.getFullYear(), 0, 1),
                $lte: new Date(now.getFullYear(), 11, 31),
              }
              break
          }

          const expenseFilter: Record<string, unknown> = {
            userId,
            date: dateFilter,
          }

          if (budget.categoryId) {
            expenseFilter.categoryId = budget.categoryId
          }

          const expenses = await Expense.find(expenseFilter)
          const spentAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
          const remainingAmount = budget.amount - spentAmount
          const percentage = (spentAmount / budget.amount) * 100
          const isOverBudget = spentAmount > budget.amount

          return {
            ...budget,
            progress: {
              spentAmount,
              remainingAmount,
              percentage: Math.round(percentage * 100) / 100,
              isOverBudget,
            },
          }
        })
      )

      return NextResponse.json(budgetsWithProgress)
    }

    return NextResponse.json(transformedBudgets)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get budgets error:', error)
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
    const { name, amount, period, categoryId } = budgetSchema.parse(body)

    const budget = await Budget.create({
      name,
      amount,
      period,
      categoryId: categoryId || null,
      userId,
    })

    // Populate the category if it exists
    if (categoryId) {
      await budget.populate('categoryId', 'name color')
    }

    // Transform the data to match the expected format
    const transformedBudget = {
      id: budget._id.toString(),
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.categoryId?._id?.toString() || null,
      userId: budget.userId,
      isActive: budget.isActive,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      category: budget.categoryId ? {
        id: budget.categoryId._id.toString(),
        name: budget.categoryId.name,
        color: budget.categoryId.color,
      } : null,
    }

    return NextResponse.json(transformedBudget, { status: 201 })
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

    console.error('Create budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
