import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import Category from '@/models/Category'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'
import { formatCurrency } from '@/lib/currency'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { period, customDateRange, format } = await request.json()

    // Get user data
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range
    let startDate: Date, endDate: Date
    const now = new Date()

    if (customDateRange) {
      startDate = new Date(customDateRange.startDate)
      endDate = new Date(customDateRange.endDate)
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          endDate = now
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear(), 11, 31)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          endDate = now
      }
    }

    // Fetch data
    const [expenses, incomes, categories] = await Promise.all([
      Expense.find({
        userId: session.user.id,
        date: { $gte: startDate, $lte: endDate }
      }).populate('categoryId').sort({ date: -1 }),
      Income.find({
        userId: session.user.id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }),
      Category.find({ userId: session.user.id })
    ])

    // Calculate summary
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0)
    const netIncome = totalIncomes - totalExpenses

    // Generate PDF content
    const pdfContent = generatePDFContent({
      user: user.name,
      period,
      startDate,
      endDate,
      expenses,
      incomes,
      categories,
      summary: {
        totalExpenses,
        totalIncomes,
        netIncome
      },
      currency: user.currency
    })

    return NextResponse.json({ 
      success: true, 
      pdfContent,
      filename: `expense-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generatePDFContent(data: any) {
  const { user, period, startDate, endDate, expenses, incomes, summary, currency } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Expense Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .summary {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-item h3 {
          margin: 0 0 5px 0;
          color: #374151;
          font-size: 14px;
        }
        .summary-item .amount {
          font-size: 24px;
          font-weight: bold;
        }
        .income { color: #059669; }
        .expense { color: #dc2626; }
        .net { color: #2563eb; }
        .section {
          margin: 30px 0;
        }
        .section h2 {
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .amount-cell {
          text-align: right;
          font-weight: 500;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Expense Report</h1>
        <p><strong>User:</strong> ${user}</p>
        <p><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}</p>
        <p><strong>Date Range:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <h3>Total Income</h3>
          <div class="amount income">${formatCurrency(summary.totalIncomes, currency)}</div>
        </div>
        <div class="summary-item">
          <h3>Total Expenses</h3>
          <div class="amount expense">${formatCurrency(summary.totalExpenses, currency)}</div>
        </div>
        <div class="summary-item">
          <h3>Net Income</h3>
          <div class="amount net">${formatCurrency(summary.netIncome, currency)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Recent Expenses</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.slice(0, 20).map(expense => `
              <tr>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>${expense.description || 'No description'}</td>
                <td>${expense.categoryId?.name || 'Uncategorized'}</td>
                <td class="amount-cell expense">-${formatCurrency(expense.amount, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Recent Income</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Source</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${incomes.slice(0, 20).map(income => `
              <tr>
                <td>${new Date(income.date).toLocaleDateString()}</td>
                <td>${income.description || 'No description'}</td>
                <td>${income.source || 'N/A'}</td>
                <td class="amount-cell income">+${formatCurrency(income.amount, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Generated by Expense Tracker • ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `
}
