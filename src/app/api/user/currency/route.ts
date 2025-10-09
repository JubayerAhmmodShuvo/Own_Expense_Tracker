import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { z } from 'zod'
import { getAllCurrencies } from '@/lib/currency'

const currencyUpdateSchema = z.object({
  currency: z.string().min(3, 'Currency code is required'),
})

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    await connectDB()

    const body = await request.json()
    const { currency } = currencyUpdateSchema.parse(body)

    // Validate currency code
    const supportedCurrencies = getAllCurrencies()
    const isValidCurrency = supportedCurrencies.some(c => c.code === currency)
    
    if (!isValidCurrency) {
      return NextResponse.json(
        { error: 'Unsupported currency code' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { currency },
      { new: true, runValidators: true }
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Currency updated successfully',
      currency: user.currency,
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

    console.error('Update currency error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
