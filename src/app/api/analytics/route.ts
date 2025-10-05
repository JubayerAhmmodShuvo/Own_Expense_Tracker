import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Income from '@/models/Income'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, quarter, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter: Record<string, Date> = {}
    
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    } else {
      const now = new Date()
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
    }

    // Build query filter
    const queryFilter: Record<string, unknown> = { userId }
    
    // Only add date filter if it has valid values
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      queryFilter.date = dateFilter
    }

    // Get expenses and incomes for the period
    const [expenses, incomes] = await Promise.all([
      Expense.find(queryFilter).populate('categoryId', 'name color'),
      Income.find(queryFilter),
    ])

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const totalIncomes = incomes.reduce((sum, income) => sum + Number(income.amount), 0)
    const netIncome = totalIncomes - totalExpenses

    // Calculate expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const categoryName = expense.categoryId?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = { amount: 0, color: expense.categoryId?.color || '#6B7280' }
      }
      acc[categoryName].amount += Number(expense.amount)
      return acc
    }, {} as Record<string, { amount: number; color: string }>)

    // Calculate daily expenses for chart
    const dailyExpenses = expenses.reduce((acc, expense) => {
      const date = expense.date.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    const dailyIncomes = incomes.reduce((acc, income) => {
      const date = income.date.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += Number(income.amount)
      return acc
    }, {} as Record<string, number>)

    // Transform expenses and incomes to match expected format
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
      summary: {
        totalExpenses,
        totalIncomes,
        netIncome,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
      },
      expensesByCategory,
      dailyData: {
        expenses: dailyExpenses,
        incomes: dailyIncomes,
      },
      expenses: transformedExpenses,
      incomes: transformedIncomes,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
