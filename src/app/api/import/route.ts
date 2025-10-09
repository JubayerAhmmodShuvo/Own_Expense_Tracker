import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import Category from '@/models/Category'
import { z } from 'zod'

const importSchema = z.object({
  transactions: z.array(z.object({
    type: z.enum(['expense', 'income']),
    amount: z.number().positive(),
    description: z.string().optional(),
    date: z.string(),
    category: z.string().optional(),
    source: z.string().optional(),
  })),
  createCategories: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const { transactions, createCategories = true } = importSchema.parse(body)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdCategories: [] as string[],
    }

    // Get existing categories for the user
    const existingCategories = await Category.find({ userId })
    const categoryMap = new Map<string, string>()
    existingCategories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id.toString())
    })

    // Process each transaction
    for (const transaction of transactions) {
      try {
        let categoryId = null

        // Handle category for expenses
        if (transaction.type === 'expense' && transaction.category) {
          const categoryName = transaction.category.toLowerCase()
          
          if (categoryMap.has(categoryName)) {
            categoryId = categoryMap.get(categoryName)
          } else if (createCategories) {
            // Create new category
            const newCategory = await Category.create({
              name: transaction.category,
              color: '#3B82F6', // Default color
              userId,
            })
            categoryId = newCategory._id.toString()
            categoryMap.set(categoryName, categoryId)
            results.createdCategories.push(transaction.category)
          }
        }

        // Parse date
        const transactionDate = new Date(transaction.date)
        if (isNaN(transactionDate.getTime())) {
          throw new Error(`Invalid date: ${transaction.date}`)
        }

        // Create transaction
        if (transaction.type === 'expense') {
          await Expense.create({
            amount: transaction.amount,
            description: transaction.description || '',
            date: transactionDate,
            categoryId,
            userId,
          })
        } else {
          await Income.create({
            amount: transaction.amount,
            description: transaction.description || '',
            source: transaction.source || 'Imported',
            date: transactionDate,
            userId,
          })
        }

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Failed to import ${transaction.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    })
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

    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
