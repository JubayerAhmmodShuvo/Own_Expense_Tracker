import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import connectDB from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')

    // Build query conditions
    const expenseQuery: any = { userId: session.user.id }
    const incomeQuery: any = { userId: session.user.id }

    // Add search term
    if (search) {
      const searchRegex = new RegExp(search, 'i')
      expenseQuery.$or = [
        { description: searchRegex },
        { 'categoryId.name': searchRegex }
      ]
      incomeQuery.$or = [
        { description: searchRegex },
        { source: searchRegex }
      ]
    }

    // Add amount filters
    if (minAmount || maxAmount) {
      const amountQuery: any = {}
      if (minAmount) amountQuery.$gte = parseFloat(minAmount)
      if (maxAmount) amountQuery.$lte = parseFloat(maxAmount)
      
      expenseQuery.amount = amountQuery
      incomeQuery.amount = amountQuery
    }

    // Add date filters
    if (startDate || endDate) {
      const dateQuery: any = {}
      if (startDate) dateQuery.$gte = new Date(startDate)
      if (endDate) dateQuery.$lte = new Date(endDate)
      
      expenseQuery.date = dateQuery
      incomeQuery.date = dateQuery
    }

    let expenses: any[] = []
    let incomes: any[] = []

    // Fetch based on type filter
    if (!type || type === 'all' || type === 'expense') {
      expenses = await Expense.find(expenseQuery)
        .populate('categoryId')
        .sort({ date: -1 })
        .limit(50)
    }

    if (!type || type === 'all' || type === 'income') {
      incomes = await Income.find(incomeQuery)
        .sort({ date: -1 })
        .limit(50)
    }

    // Combine and format results
    const transactions = [
      ...expenses.map(expense => ({
        id: expense._id,
        type: 'expense' as const,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        categoryId: expense.categoryId?._id,
        category: expense.categoryId ? {
          id: expense.categoryId._id,
          name: expense.categoryId.name,
          color: expense.categoryId.color
        } : null
      })),
      ...incomes.map(income => ({
        id: income._id,
        type: 'income' as const,
        amount: income.amount,
        description: income.description,
        source: income.source,
        date: income.date
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(transactions)

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
