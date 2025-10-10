import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import User from '@/models/User'
import Expense from '@/models/Expense'
import Income from '@/models/Income'

export async function GET(request: NextRequest) {
  try {
    // console.log('Admin stats API called')
    const session = await requireAuth() as { user?: { id: string; role?: string; email?: string } }
    
    // console.log('Admin stats - Session:', session)
    // console.log('Admin stats - User role:', session.user?.role)
    // console.log('Admin stats - User email:', session.user?.email)
    
    // Check if user is admin
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      // console.log('Admin stats - Access denied, role:', session.user?.role)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // console.log('Admin stats - Connecting to database...')
    await connectDB()
    // console.log('Admin stats - Database connected')

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    // eslint-disable-next-line prefer-const
    let startDate = new Date()
    
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get user statistics
    // console.log('Admin stats - Getting user statistics...')
    const totalUsers = await User.countDocuments()
    // console.log('Admin stats - Total users:', totalUsers)
    
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: startDate }
    })
    // console.log('Admin stats - Active users:', activeUsers)

    // Get transaction statistics
    // console.log('Admin stats - Getting transaction statistics...')
    const totalExpenses = await Expense.countDocuments()
    const totalIncomes = await Income.countDocuments()
    const totalTransactions = totalExpenses + totalIncomes
    // console.log('Admin stats - Total transactions:', totalTransactions)

    // Get revenue (sum of all income) - simplified
    // console.log('Admin stats - Getting revenue...')
    const totalRevenue = 0 // Simplified for now

    // Get top users by transaction count
    // console.log('Admin stats - Getting top users...')
    
    // First, let's get all users and their transaction counts
    const allUsers = await User.find({}).select('_id name email createdAt currency')
    // console.log('Admin stats - Total users found:', allUsers.length)
    
    const topUsers = []
    
    for (const user of allUsers) {
      // Get expenses for this user
      const expenses = await Expense.find({ userId: user._id.toString() })
      const incomes = await Income.find({ userId: user._id.toString() })
      
      const transactionCount = expenses.length + incomes.length
      const totalExpenseAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const totalIncomeAmount = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0)
      const totalAmount = totalExpenseAmount + totalIncomeAmount
      
      // Get last active date
      const expenseDates = expenses.map(exp => exp.date).filter(Boolean)
      const incomeDates = incomes.map(inc => inc.date).filter(Boolean)
      const allDates = [...expenseDates, ...incomeDates]
      const lastActive = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : null
      
      topUsers.push({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        transactionCount,
        totalAmount,
        totalExpenseAmount,
        totalIncomeAmount,
        createdAt: user.createdAt.toISOString(),
        lastActive: lastActive ? lastActive.toISOString() : null,
        currency: user.currency
      })
    }
    
    // Sort by transaction count and limit to 10
    topUsers.sort((a, b) => b.transactionCount - a.transactionCount)
    const limitedTopUsers = topUsers.slice(0, 10)
    
    // console.log('Admin stats - Top users processed:', limitedTopUsers.length)
    // console.log('Admin stats - Sample user:', limitedTopUsers[0])

    // Get user growth data
    //    console.log('Admin stats - Getting user growth...')
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          users: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          users: 1
        }
      }
    ])

    // Get transaction trends
    // console.log('Admin stats - Getting transaction trends...')
    const transactionTrends = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          expenses: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          expenses: 1
        }
      }
    ])

    const incomeTrends = await Income.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          incomes: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          incomes: 1
        }
      }
    ])

    // Generate recent activity
    const recentActivity = [
      {
        id: '1',
        type: 'user',
        message: 'New user registered',
        timestamp: new Date().toISOString(),
        severity: 'info' as const
      },
      {
        id: '2',
        type: 'transaction',
        message: 'High transaction volume detected',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'warning' as const
      },
      {
        id: '3',
        type: 'system',
        message: 'Database backup completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        severity: 'info' as const
      }
    ]

    // Mock system load data
    const systemLoad = {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
    }

    const stats = {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      systemLoad,
      recentActivity,
      userGrowth,
      topUsers: limitedTopUsers,
      transactionTrends: {
        expenses: transactionTrends,
        incomes: incomeTrends
      }
    }

    // console.log('Admin stats - Returning stats:', stats)
    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}