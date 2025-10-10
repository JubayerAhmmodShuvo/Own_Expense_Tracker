import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import Category from '@/models/Category'
import Budget from '@/models/Budget'
import RecurringTransaction from '@/models/RecurringTransaction'
import Tag from '@/models/Tag'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Get all user data
    const [
      user,
      expenses,
      incomes,
      categories,
      budgets,
      recurringTransactions,
      tags
    ] = await Promise.all([
      User.findById(userId).select('-password'),
      Expense.find({ userId }).populate('categoryId', 'name color').populate('tags', 'name color'),
      Income.find({ userId }).populate('tags', 'name color'),
      Category.find({ userId }),
      Budget.find({ userId }).populate('categoryId', 'name color'),
      RecurringTransaction.find({ userId }).populate('categoryId', 'name color'),
      Tag.find({ userId })
    ])

    const backupData = {
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        userId: userId,
        userEmail: user?.email,
        userName: user?.name,
        currency: user?.currency,
      },
      data: {
        user: user ? {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          currency: user.currency,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } : null,
        expenses: expenses.map(expense => ({
          id: expense._id.toString(),
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
          categoryId: expense.categoryId?._id?.toString() || null,
          category: expense.categoryId ? {
            id: expense.categoryId._id.toString(),
            name: expense.categoryId.name,
            color: expense.categoryId.color,
          } : null,
          tags: expense.tags?.map((tag: { _id: { toString(): string }; name: string; color: string }) => ({
            id: tag._id.toString(),
            name: tag.name,
            color: tag.color,
          })) || [],
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt,
        })),
        incomes: incomes.map(income => ({
          id: income._id.toString(),
          amount: income.amount,
          description: income.description,
          source: income.source,
          date: income.date,
          tags: income.tags?.map((tag: { _id: { toString(): string }; name: string; color: string }) => ({
            id: tag._id.toString(),
            name: tag.name,
            color: tag.color,
          })) || [],
          createdAt: income.createdAt,
          updatedAt: income.updatedAt,
        })),
        categories: categories.map(category => ({
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          color: category.color,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        })),
        budgets: budgets.map(budget => ({
          id: budget._id.toString(),
          name: budget.name,
          amount: budget.amount,
          period: budget.period,
          categoryId: budget.categoryId?._id?.toString() || null,
          category: budget.categoryId ? {
            id: budget.categoryId._id.toString(),
            name: budget.categoryId.name,
            color: budget.categoryId.color,
          } : null,
          isActive: budget.isActive,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        })),
        recurringTransactions: recurringTransactions.map(transaction => ({
          id: transaction._id.toString(),
          name: transaction.name,
          amount: transaction.amount,
          description: transaction.description,
          type: transaction.type,
          frequency: transaction.frequency,
          categoryId: transaction.categoryId?._id?.toString() || null,
          category: transaction.categoryId ? {
            id: transaction.categoryId._id.toString(),
            name: transaction.categoryId.name,
            color: transaction.categoryId.color,
          } : null,
          source: transaction.source,
          startDate: transaction.startDate,
          endDate: transaction.endDate,
          nextDueDate: transaction.nextDueDate,
          isActive: transaction.isActive,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        })),
        tags: tags.map(tag => ({
          id: tag._id.toString(),
          name: tag.name,
          color: tag.color,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        })),
      },
      summary: {
        totalExpenses: expenses.length,
        totalIncomes: incomes.length,
        totalCategories: categories.length,
        totalBudgets: budgets.length,
        totalRecurringTransactions: recurringTransactions.length,
        totalTags: tags.length,
        totalExpenseAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalIncomeAmount: incomes.reduce((sum, inc) => sum + inc.amount, 0),
      }
    }

    if (format === 'csv') {
      // Generate CSV format
      let csvContent = 'Type,ID,Amount,Description,Date,Category,Source,Tags\n'
      
      // Add expenses
      expenses.forEach(expense => {
        const tags = expense.tags?.map((tag: { name: string }) => tag.name).join(';') || ''
        csvContent += `Expense,${expense._id},${expense.amount},"${expense.description || ''}",${expense.date.toISOString().split('T')[0]},${expense.categoryId?.name || ''},,"${tags}"\n`
      })
      
      // Add incomes
      incomes.forEach(income => {
        const tags = income.tags?.map((tag: { name: string }) => tag.name).join(';') || ''
        csvContent += `Income,${income._id},${income.amount},"${income.description || ''}",${income.date.toISOString().split('T')[0]},,${income.source || ''},"${tags}"\n`
      })

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="expense-tracker-backup-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Return JSON format
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
