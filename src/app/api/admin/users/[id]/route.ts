import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth-utils'
import User from '@/models/User'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string; role?: string } }
    
    // Check if user is admin
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()

    const { action } = await request.json()
    const userId = id

    let updateData = {}
    let message = ''

    switch (action) {
      case 'activate':
        updateData = { isActive: true }
        message = 'User activated successfully'
        break
      case 'deactivate':
        updateData = { isActive: false }
        message = 'User deactivated successfully'
        break
      case 'delete':
        await User.findByIdAndDelete(userId)
        return NextResponse.json({ message: 'User deleted successfully' })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message, user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth() as { user?: { id: string; role?: string } }
    
    // Check if user is admin
    if (session.user?.role !== 'admin' && session.user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()

    const userId = id
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
