import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import RecurringTransaction from '@/models/RecurringTransaction'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import { z } from 'zod'

const processRecurringSchema = z.object({
  recurringTransactionId: z.string(),
  processDate: z.string().optional(), // Optional date to process, defaults to today
})

// Helper function to calculate next due date
function calculateNextDueDate(currentDate: Date, frequency: string): Date {
  const nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }
  
  return nextDate
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const { recurringTransactionId, processDate } = processRecurringSchema.parse(body)

    // Find the recurring transaction
    const recurringTransaction = await RecurringTransaction.findOne({
      _id: recurringTransactionId,
      userId,
      isActive: true,
    }).populate('categoryId', 'name color')

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 })
    }

    // Check if it's time to process this transaction
    const today = new Date()
    const processDateObj = processDate ? new Date(processDate) : today
    
    if (processDateObj < recurringTransaction.nextDueDate) {
      return NextResponse.json({ 
        error: 'Transaction is not due yet',
        nextDueDate: recurringTransaction.nextDueDate 
      }, { status: 400 })
    }

    // Check if transaction already exists for this period
    const existingTransactionFilter: Record<string, unknown> = {
      userId,
      amount: recurringTransaction.amount,
      date: {
        $gte: new Date(processDateObj.getFullYear(), processDateObj.getMonth(), processDateObj.getDate()),
        $lt: new Date(processDateObj.getFullYear(), processDateObj.getMonth(), processDateObj.getDate() + 1),
      }
    }

    if (recurringTransaction.type === 'expense') {
      existingTransactionFilter.categoryId = recurringTransaction.categoryId?._id?.toString() || null
      const existingExpense = await Expense.findOne(existingTransactionFilter)
      if (existingExpense) {
        return NextResponse.json({ 
          error: 'Transaction already exists for this period',
          existingTransactionId: existingExpense._id.toString()
        }, { status: 400 })
      }
    } else {
      existingTransactionFilter.source = recurringTransaction.source
      const existingIncome = await Income.findOne(existingTransactionFilter)
      if (existingIncome) {
        return NextResponse.json({ 
          error: 'Transaction already exists for this period',
          existingTransactionId: existingIncome._id.toString()
        }, { status: 400 })
      }
    }

    // Create the actual transaction
    let createdTransaction
    if (recurringTransaction.type === 'expense') {
      createdTransaction = await Expense.create({
        amount: recurringTransaction.amount,
        description: recurringTransaction.description || `Recurring: ${recurringTransaction.name}`,
        date: processDateObj,
        categoryId: recurringTransaction.categoryId?._id?.toString() || null,
        userId,
      })
    } else {
      createdTransaction = await Income.create({
        amount: recurringTransaction.amount,
        description: recurringTransaction.description || `Recurring: ${recurringTransaction.name}`,
        source: recurringTransaction.source || recurringTransaction.name,
        date: processDateObj,
        userId,
      })
    }

    // Update the next due date
    const nextDueDate = calculateNextDueDate(processDateObj, recurringTransaction.frequency)
    
    // Check if we've reached the end date
    let isActive = recurringTransaction.isActive
    if (recurringTransaction.endDate && nextDueDate > recurringTransaction.endDate) {
      isActive = false
    }

    await RecurringTransaction.findByIdAndUpdate(recurringTransactionId, {
      nextDueDate,
      isActive,
    })

    return NextResponse.json({
      message: 'Recurring transaction processed successfully',
      transaction: {
        id: createdTransaction._id.toString(),
        type: recurringTransaction.type,
        amount: createdTransaction.amount,
        date: createdTransaction.date,
      },
      nextDueDate,
      isActive,
    }, { status: 201 })
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

    console.error('Process recurring transaction error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
