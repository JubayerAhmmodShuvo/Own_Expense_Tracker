import connectDB from '@/lib/mongodb'
import Admin from '@/models/Admin'

async function seedAdmin() {
  try {
    await connectDB()
    // console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin.expensetracker@jubayer.com' })
    
    if (existingAdmin) {
      // console.log('Admin user already exists')
      return
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
    // console.log('Admin user created successfully')
    // console.log('Email:', admin.email)
    // console.log('Name:', admin.name)
    // console.log('Role:', admin.role)

  } catch (error) {
    console.error('Error seeding admin user:', error)
  } finally {
    process.exit(0)
  }
}

seedAdmin()
