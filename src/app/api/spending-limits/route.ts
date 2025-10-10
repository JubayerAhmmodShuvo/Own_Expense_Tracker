import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import SpendingLimit from '@/models/SpendingLimit'
import Category from '@/models/Category'
import Expense from '@/models/Expense'

import { z } from 'zod'
import connectDB from '@/lib/mongodb'

const createSpendingLimitSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.number().min(0),
})

export async function GET() {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const spendingLimits = await SpendingLimit.find({ 
      userId: userId,
      isActive: true 
    }).populate('categoryId')

    // Calculate current spending for each category this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const limitsWithSpending = await Promise.all(
      spendingLimits.map(async (limit) => {
        const expenses = await Expense.find({
          userId: userId,
          categoryId: limit.categoryId._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        })

        const currentSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const percentage = (currentSpending / limit.monthlyLimit) * 100

        return {
          id: limit._id,
          categoryId: limit.categoryId._id,
          categoryName: limit.categoryId.name,
          categoryColor: limit.categoryId.color,
          monthlyLimit: limit.monthlyLimit,
          currentSpending,
          remaining: limit.monthlyLimit - currentSpending,
          percentage: Math.min(percentage, 100),
          isOverLimit: currentSpending > limit.monthlyLimit,
          createdAt: limit.createdAt,
          updatedAt: limit.updatedAt,
        }
      })
    )

    return NextResponse.json(limitsWithSpending)

  } catch (error) {
    console.error('Error fetching spending limits:', error)
    return NextResponse.json({ error: 'Failed to fetch spending limits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const body = await request.json()
    const { categoryId, monthlyLimit } = createSpendingLimitSchema.parse(body)

    // Check if category exists and belongs to user
    const category = await Category.findOne({ 
      _id: categoryId, 
      userId: userId 
    })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if spending limit already exists for this category
    const existingLimit = await SpendingLimit.findOne({
      userId: userId,
      categoryId: categoryId
    })

    if (existingLimit) {
      // Update existing limit
      existingLimit.monthlyLimit = monthlyLimit
      existingLimit.isActive = true
      await existingLimit.save()
      return NextResponse.json({ 
        message: 'Spending limit updated successfully',
        spendingLimit: existingLimit 
      })
    } else {
      // Create new limit
      const spendingLimit = new SpendingLimit({
        userId: userId,
        categoryId,
        monthlyLimit,
      })

      await spendingLimit.save()
      return NextResponse.json({ 
        message: 'Spending limit created successfully',
        spendingLimit 
      })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }
    console.error('Error creating spending limit:', error)
    return NextResponse.json({ error: 'Failed to create spending limit' }, { status: 500 })
  }
}
