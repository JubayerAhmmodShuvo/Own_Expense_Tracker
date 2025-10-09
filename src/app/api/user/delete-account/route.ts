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
import { z } from 'zod'

const deleteAccountSchema = z.object({
  confirmation: z.string().refine(val => val === 'DELETE', {
    message: 'Confirmation text must be "DELETE"',
  }),
})

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const { confirmation } = deleteAccountSchema.parse(body)

    // Delete all user data
    await Promise.all([
      Expense.deleteMany({ userId }),
      Income.deleteMany({ userId }),
      Category.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      RecurringTransaction.deleteMany({ userId }),
      Tag.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ])

    return NextResponse.json({
      message: 'Account and all associated data have been permanently deleted',
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

    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
