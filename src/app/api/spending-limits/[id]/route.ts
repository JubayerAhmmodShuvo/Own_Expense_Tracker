import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SpendingLimit from '@/models/SpendingLimit'
import connectDB from '@/lib/mongodb'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const spendingLimit = await SpendingLimit.findOneAndDelete({
      _id: params.id,
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
