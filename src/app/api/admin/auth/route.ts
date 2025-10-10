import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()

    // Find admin by email
    const admin = await Admin.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    })

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Update last login
    await admin.updateLastLogin()

    // Return admin info (without password)
    const adminInfo = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLogin: admin.lastLogin
    }

    return NextResponse.json({ 
      success: true, 
      admin: adminInfo,
      message: 'Admin authentication successful'
    })

  } catch (error) {
    console.error('Admin authentication error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
