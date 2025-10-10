import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'

export async function GET() {
  try {
    await connectDB()
    // console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin.expensetracker@jubayer.com' })
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      })
    }

    // Create admin user
    const admin = new Admin({
      email: 'admin.expensetracker@jubayer.com',
      password: '@123456@#',
      name: 'System Administrator',
      role: 'super_admin',
      isActive: true
    })

    await admin.save()
    
    return NextResponse.json({ 
      message: 'Admin user created successfully',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })

  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return GET()
}
