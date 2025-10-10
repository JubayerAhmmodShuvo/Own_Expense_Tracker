import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import SpendingLimit from '@/models/SpendingLimit'
import connectDB from '@/lib/mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string } }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const spendingLimit = await SpendingLimit.findOneAndDelete({
      _id: id,
      userId: session.user.id
    })

    if (!spendingLimit) {
      return NextResponse.json({ error: 'Spending limit not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Spending limit deleted successfully' })

  } catch (error) {
    console.error('Error deleting spending limit:', error)
    return NextResponse.json({ error: 'Failed to delete spending limit' }, { status: 500 })
  }
}
