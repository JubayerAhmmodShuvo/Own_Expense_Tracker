import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import Income from '@/models/Income'
import { z } from 'zod'

const updateIncomeSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  date: z.string().datetime().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    const income = await Income.findOne({
      _id: id,
      userId,
    })

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedIncome = {
      id: income._id.toString(),
      amount: income.amount,
      description: income.description,
      source: income.source,
      date: income.date,
      userId: income.userId,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    }

    return NextResponse.json(transformedIncome)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get income error:', error)
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
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    const body = await request.json()
    const updateData = updateIncomeSchema.parse(body)

    // Check if income exists and belongs to user
    const existingIncome = await Income.findOne({
      _id: id,
      userId,
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    const updateFields: Record<string, unknown> = {}
    if (updateData.amount !== undefined) updateFields.amount = updateData.amount
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.source !== undefined) updateFields.source = updateData.source
    if (updateData.date !== undefined) updateFields.date = new Date(updateData.date)

    const income = await Income.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    )

    if (!income) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedIncome = {
      id: income._id.toString(),
      amount: income.amount,
      description: income.description,
      source: income.source,
      date: income.date,
      userId: income.userId,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    }

    return NextResponse.json(transformedIncome)
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

    console.error('Update income error:', error)
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
    const userId = await requireAuth()
    await connectDB()
    const { id } = await params

    // Check if income exists and belongs to user
    const existingIncome = await Income.findOne({
      _id: id,
      userId,
    })

    if (!existingIncome) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 })
    }

    await Income.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Income deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete income error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
