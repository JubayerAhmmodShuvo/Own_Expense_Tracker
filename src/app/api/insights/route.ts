import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import SpendingLimit from '@/models/SpendingLimit'
import connectDB from '@/lib/mongodb'


export async function GET() {
  try {
    const userId = await requireAuth()
    await connectDB()

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Current month data
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0)
    
    // Previous month data
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const previousMonthEnd = new Date(currentYear, currentMonth, 0)

    // Fetch current month expenses
    const currentExpenses = await Expense.find({
      userId: userId,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    }).populate('categoryId')

    // Fetch previous month expenses
    const previousExpenses = await Expense.find({
      userId: userId,
      date: { $gte: previousMonthStart, $lte: previousMonthEnd }
    })

    // Fetch current month income
    const currentIncome = await Income.find({
      userId: userId,
      date: { $gte: currentMonthStart, $lte: currentMonthEnd }
    })

    // Fetch spending limits
    const spendingLimits = await SpendingLimit.find({
      userId: userId,
      isActive: true
    }).populate('categoryId')

    const insights = []

    // Calculate total spending comparison
    const currentTotal = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const previousTotal = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    if (previousTotal > 0) {
      const spendingChange = ((currentTotal - previousTotal) / previousTotal) * 100
      
      if (Math.abs(spendingChange) > 10) { // Only show if change is significant
        insights.push({
          id: 'spending-change',
          type: spendingChange > 0 ? 'increase' : 'decrease',
          title: spendingChange > 0 ? 'Spending Increased' : 'Spending Decreased',
          message: spendingChange > 0 
            ? `You spent ${Math.abs(spendingChange).toFixed(1)}% more this month compared to last month.`
            : `Great job! You spent ${Math.abs(spendingChange).toFixed(1)}% less this month compared to last month.`,
          percentage: Math.abs(spendingChange),
          amount: Math.abs(currentTotal - previousTotal)
        })
      }
    }

    // Check spending limits
    for (const limit of spendingLimits) {
      const categoryExpenses = currentExpenses.filter(
        expense => expense.categoryId?._id?.toString() === limit.categoryId._id.toString()
      )
      const categorySpending = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const percentage = (categorySpending / limit.monthlyLimit) * 100

      if (percentage > 100) {
        insights.push({
          id: `limit-exceeded-${limit._id}`,
          type: 'warning',
          title: 'Budget Limit Exceeded',
          message: `You've exceeded your ${limit.categoryId.name} budget by ${(percentage - 100).toFixed(1)}%.`,
          percentage: percentage - 100,
          amount: categorySpending - limit.monthlyLimit,
          category: limit.categoryId.name
        })
      } else if (percentage > 80) {
        insights.push({
          id: `limit-warning-${limit._id}`,
          type: 'warning',
          title: 'Approaching Budget Limit',
          message: `You've used ${percentage.toFixed(1)}% of your ${limit.categoryId.name} budget.`,
          percentage: percentage,
          category: limit.categoryId.name
        })
      }
    }

    // Check for high spending categories
    const categorySpending: { [key: string]: number } = {}
    currentExpenses.forEach(expense => {
      const categoryName = expense.categoryId?.name || 'Uncategorized'
      categorySpending[categoryName] = (categorySpending[categoryName] || 0) + expense.amount
    })

    const sortedCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0]
      const topCategoryPercentage = (topCategory[1] / currentTotal) * 100
      
      if (topCategoryPercentage > 40) {
        insights.push({
          id: 'top-category',
          type: 'info',
          title: 'Top Spending Category',
          message: `${topCategory[0]} accounts for ${topCategoryPercentage.toFixed(1)}% of your monthly spending.`,
          percentage: topCategoryPercentage,
          category: topCategory[0]
        })
      }
    }

    // Check for savings opportunity
    const currentIncomeTotal = currentIncome.reduce((sum, income) => sum + income.amount, 0)
    const savingsRate = currentIncomeTotal > 0 ? ((currentIncomeTotal - currentTotal) / currentIncomeTotal) * 100 : 0

    if (savingsRate < 10 && currentIncomeTotal > 0) {
      insights.push({
        id: 'savings-low',
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Consider reducing expenses to increase savings.`,
        percentage: savingsRate
      })
    } else if (savingsRate > 20) {
      insights.push({
        id: 'savings-good',
        type: 'achievement',
        title: 'Great Savings Rate!',
        message: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income this month.`,
        percentage: savingsRate
      })
    }

    // Check for daily spending patterns
    const dailySpending: { [key: string]: number } = {}
    currentExpenses.forEach(expense => {
      const day = new Date(expense.date).toLocaleDateString()
      dailySpending[day] = (dailySpending[day] || 0) + expense.amount
    })

    const dailyAverages = Object.values(dailySpending)
    const avgDailySpending = dailyAverages.reduce((sum, amount) => sum + amount, 0) / dailyAverages.length
    const maxDailySpending = Math.max(...dailyAverages)

    if (maxDailySpending > avgDailySpending * 2) {
      insights.push({
        id: 'spending-spike',
        type: 'warning',
        title: 'High Spending Day Detected',
        message: `You had a day with significantly higher spending than your average.`,
        amount: maxDailySpending - avgDailySpending
      })
    }

    return NextResponse.json(insights.slice(0, 5)) // Limit to 5 insights

  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}
