import connectDB from '../src/lib/mongodb'
import User from '../src/models/User'
import Category from '../src/models/Category'
import Expense from '../src/models/Expense'
import Income from '../src/models/Income'
import bcrypt from 'bcryptjs'

async function seedDatabase() {
  try {
    console.log('Starting database seed...')
    
    await connectDB()

    // Clear existing data
    await User.deleteMany({})
    await Category.deleteMany({})
    await Expense.deleteMany({})
    await Income.deleteMany({})

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 12)
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
    })

    console.log('Created demo user:', demoUser.email)

    // Create default categories
    const defaultCategories = [
      { name: 'Food & Dining', color: '#EF4444' },
      { name: 'Transportation', color: '#3B82F6' },
      { name: 'Shopping', color: '#10B981' },
      { name: 'Entertainment', color: '#F59E0B' },
      { name: 'Bills & Utilities', color: '#8B5CF6' },
      { name: 'Healthcare', color: '#EC4899' },
      { name: 'Education', color: '#06B6D4' },
      { name: 'Other', color: '#6B7280' },
    ]

    const categories = await Category.insertMany(
      defaultCategories.map(category => ({
        ...category,
        userId: demoUser._id.toString(),
      }))
    )

    console.log('Created default categories')

    // Create sample expenses
    const sampleExpenses = [
      {
        amount: 25.50,
        description: 'Lunch at restaurant',
        date: new Date('2024-01-15'),
        categoryId: categories[0]._id.toString(), // Food & Dining
        userId: demoUser._id.toString(),
      },
      {
        amount: 12.00,
        description: 'Uber ride',
        date: new Date('2024-01-16'),
        categoryId: categories[1]._id.toString(), // Transportation
        userId: demoUser._id.toString(),
      },
      {
        amount: 89.99,
        description: 'New shirt',
        date: new Date('2024-01-17'),
        categoryId: categories[2]._id.toString(), // Shopping
        userId: demoUser._id.toString(),
      },
      {
        amount: 15.00,
        description: 'Movie ticket',
        date: new Date('2024-01-18'),
        categoryId: categories[3]._id.toString(), // Entertainment
        userId: demoUser._id.toString(),
      },
      {
        amount: 120.00,
        description: 'Electricity bill',
        date: new Date('2024-01-19'),
        categoryId: categories[4]._id.toString(), // Bills & Utilities
        userId: demoUser._id.toString(),
      },
    ]

    await Expense.insertMany(sampleExpenses)
    console.log('Created sample expenses')

    // Create sample income
    const sampleIncome = {
      amount: 3000.00,
      description: 'Monthly salary',
      source: 'Company ABC',
      date: new Date('2024-01-01'),
      userId: demoUser._id.toString(),
    }

    await Income.create(sampleIncome)
    console.log('Created sample income')

    console.log('Database seed completed successfully!')
    console.log('\nDemo account credentials:')
    console.log('Email: demo@example.com')
    console.log('Password: demo123')

  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

seedDatabase()
