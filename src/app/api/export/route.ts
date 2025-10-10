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
    const type = searchParams.get('type') // 'expenses', 'incomes', or 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv' // 'csv' or 'json'

    // Build date filter
    let dateFilter: Record<string, Date> = {}
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const queryFilter: Record<string, unknown> = { userId }
    if (Object.keys(dateFilter).length > 0) {
      queryFilter.date = dateFilter
    }

    let csvContent = ''
    let filename = 'transactions'

    if (type === 'expenses' || type === 'all') {
      const expenses = await Expense.find(queryFilter)
        .populate('categoryId', 'name color')
        .sort({ date: -1 })

      if (type === 'expenses') {
        filename = 'expenses'
        csvContent = 'Date,Amount,Description,Category\n'
        expenses.forEach(expense => {
          const date = new Date(expense.date).toLocaleDateString()
          const amount = expense.amount.toString()
          const description = (expense.description || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
          const category = expense.categoryId?.name || 'Uncategorized'
          csvContent += `${date},${amount},"${description}",${category}\n`
        })
      } else {
        filename = 'all-transactions'
        csvContent = 'Type,Date,Amount,Description,Category/Source\n'
        expenses.forEach(expense => {
          const date = new Date(expense.date).toLocaleDateString()
          const amount = expense.amount.toString()
          const description = (expense.description || '').replace(/,/g, ';')
          const category = expense.categoryId?.name || 'Uncategorized'
          csvContent += `Expense,${date},${amount},"${description}",${category}\n`
        })
      }
    }

    if (type === 'incomes' || type === 'all') {
      const incomes = await Income.find(queryFilter).sort({ date: -1 })

      if (type === 'incomes') {
        filename = 'incomes'
        csvContent = 'Date,Amount,Description,Source\n'
        incomes.forEach(income => {
          const date = new Date(income.date).toLocaleDateString()
          const amount = income.amount.toString()
          const description = (income.description || '').replace(/,/g, ';')
          const source = income.source || 'Unknown'
          csvContent += `${date},${amount},"${description}",${source}\n`
        })
      } else {
        // Add to existing CSV content for 'all' type
        incomes.forEach(income => {
          const date = new Date(income.date).toLocaleDateString()
          const amount = income.amount.toString()
          const description = (income.description || '').replace(/,/g, ';')
          const source = income.source || 'Unknown'
          csvContent += `Income,${date},${amount},"${description}",${source}\n`
        })
      }
    }

    if (format === 'json') {
      const expenses = await Expense.find(queryFilter)
        .populate('categoryId', 'name color')
        .sort({ date: -1 })
      
      const incomes = await Income.find(queryFilter).sort({ date: -1 })

      const jsonData = {
        expenses: expenses.map(expense => ({
          id: expense._id.toString(),
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          category: expense.categoryId?.name || 'Uncategorized',
          categoryColor: expense.categoryId?.color,
        })),
        incomes: incomes.map(income => ({
          id: income._id.toString(),
          amount: income.amount,
          description: income.description,
          source: income.source,
          date: income.date,
        })),
        exportDate: new Date().toISOString(),
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalIncomes: incomes.reduce((sum, inc) => sum + inc.amount, 0),
      }

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      })
    }

    // Return CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
