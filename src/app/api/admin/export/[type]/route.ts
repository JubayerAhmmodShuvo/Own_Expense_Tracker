import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import User from '@/models/User'
import Expense from '@/models/Expense'
import Income from '@/models/Income'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const session = await requireAuth()
    
    // Check if user is admin
    if ((session.user as { role?: string })?.role !== 'admin' && (session.user as { role?: string })?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()

    let data = []
    let filename = ''

    switch (type) {
      case 'users':
        data = await User.find({}).select('-password').lean()
        filename = 'users-export'
        break
      case 'transactions':
        const expenses = await Expense.find({}).populate('userId', 'name email').lean()
        const incomes = await Income.find({}).populate('userId', 'name email').lean()
        
        data = [
          ...expenses.map(expense => ({
            type: 'expense',
            user: expense.userId?.name || 'Unknown',
            email: expense.userId?.email || 'Unknown',
            amount: expense.amount,
            description: expense.description,
            category: expense.category?.name || 'Uncategorized',
            date: expense.date,
            createdAt: expense.createdAt
          })),
          ...incomes.map(income => ({
            type: 'income',
            user: income.userId?.name || 'Unknown',
            email: income.userId?.email || 'Unknown',
            amount: income.amount,
            description: income.description || income.source,
            category: 'Income',
            date: income.date,
            createdAt: income.createdAt
          }))
        ]
        filename = 'transactions-export'
        break
      case 'analytics':
        const totalUsers = await User.countDocuments()
        const totalExpenses = await Expense.countDocuments()
        const totalIncomes = await Income.countDocuments()
        const totalRevenue = await Income.aggregate([
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        
        data = [{
          metric: 'Total Users',
          value: totalUsers,
          timestamp: new Date().toISOString()
        }, {
          metric: 'Total Expenses',
          value: totalExpenses,
          timestamp: new Date().toISOString()
        }, {
          metric: 'Total Incomes',
          value: totalIncomes,
          timestamp: new Date().toISOString()
        }, {
          metric: 'Total Revenue',
          value: totalRevenue[0]?.total || 0,
          timestamp: new Date().toISOString()
        }]
        filename = 'analytics-export'
        break
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Convert to CSV
    const csv = convertToCSV(data)
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = []
  
  // Add header row
  csvRows.push(headers.join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}
