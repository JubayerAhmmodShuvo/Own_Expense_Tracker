import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Budget from '@/models/Budget'
import { z } from 'zod'

const budgetUpdateSchema = z.object({
  name: z.string().min(1, 'Budget name is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  period: z.enum(['monthly', 'weekly', 'yearly']).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const budget = await Budget.findOne({
      _id: id,
      userId,
    }).populate('categoryId', 'name color')

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
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

    return NextResponse.json(transformedBudget)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const body = await request.json()
    const updateData = budgetUpdateSchema.parse(body)

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color')

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
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

    return NextResponse.json(transformedBudget)
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

    console.error('Update budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId,
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete budget error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
