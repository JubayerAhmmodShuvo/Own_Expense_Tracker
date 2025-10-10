import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import Expense from '@/models/Expense'
import Income from '@/models/Income'
import Category from '@/models/Category'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'
import { formatCurrency } from '@/lib/currency'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth() as { user?: { id: string } }
    const userId = session.user?.id
    await connectDB()

    const { period, customDateRange } = await request.json()

    // Get user data
    const user = await User.findById(userId)
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
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }).populate('categoryId').sort({ date: -1 }),
      Income.find({
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }),
      Category.find({ userId: userId })
    ])

    // Calculate summary
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0)
    const netIncome = totalIncomes - totalExpenses

    // Generate HTML content for PDF
    const htmlContent = generateHTMLContent({
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

    // Return HTML content that can be converted to PDF on the client side
    return NextResponse.json({ 
      success: true, 
      htmlContent,
      filename: `expense-report-${period}-${new Date().toISOString().split('T')[0]}.html`
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

function generateHTMLContent(data: {
  user: string
  period: string
  startDate: Date
  endDate: Date
  expenses: Array<{
    date: Date
    description?: string
    amount: number
    categoryId?: { name: string; color: string }
  }>
  incomes: Array<{
    date: Date
    description?: string
    amount: number
    source?: string
  }>
  categories: Array<{
    name: string
    color: string
  }>
  summary: {
    totalExpenses: number
    totalIncomes: number
    netIncome: number
  }
  currency: string
}) {
  const { user, period, startDate, endDate, expenses, incomes, summary, currency } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Expense Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 20px;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #2563eb;
          font-size: 32px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header-info {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-top: 15px;
          font-size: 14px;
          color: #666;
        }
        
        .header-info div {
          margin: 5px 0;
        }
        
        .summary {
          display: flex;
          justify-content: space-around;
          margin: 40px 0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 30px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .summary-item {
          text-align: center;
          flex: 1;
        }
        
        .summary-item h3 {
          font-size: 16px;
          color: #374151;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .summary-item .amount {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .income { color: #059669; }
        .expense { color: #dc2626; }
        .net { color: #2563eb; }
        
        .section {
          margin: 40px 0;
        }
        
        .section h2 {
          color: #374151;
          font-size: 24px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        th, td {
          padding: 15px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        td {
          font-size: 14px;
        }
        
        .amount-cell {
          text-align: right;
          font-weight: 600;
        }
        
        .category-cell {
          display: flex;
          align-items: center;
        }
        
        .category-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
          display: inline-block;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        
        .no-data {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          padding: 40px 20px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            max-width: none;
            margin: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Expense Report</h1>
          <div class="header-info">
            <div><strong>User:</strong> ${user}</div>
            <div><strong>Period:</strong> ${period.charAt(0).toUpperCase() + period.slice(1)}</div>
            <div><strong>Date Range:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
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
          ${expenses.length > 0 ? `
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
                ${expenses.map(expense => `
                  <tr>
                    <td>${new Date(expense.date).toLocaleDateString()}</td>
                    <td>${expense.description || 'No description'}</td>
                    <td class="category-cell">
                      ${expense.categoryId ? `
                        <span class="category-color" style="background-color: ${expense.categoryId.color}"></span>
                        ${expense.categoryId.name}
                      ` : 'Uncategorized'}
                    </td>
                    <td class="amount-cell expense">-${formatCurrency(expense.amount, currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              No expenses found for the selected period.
            </div>
          `}
        </div>

        <div class="section">
          <h2>Recent Income</h2>
          ${incomes.length > 0 ? `
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
                ${incomes.map(income => `
                  <tr>
                    <td>${new Date(income.date).toLocaleDateString()}</td>
                    <td>${income.description || 'No description'}</td>
                    <td>${income.source || 'N/A'}</td>
                    <td class="amount-cell income">+${formatCurrency(income.amount, currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              No income found for the selected period.
            </div>
          `}
        </div>

        <div class="footer">
          <p>Generated by Expense Tracker • ${new Date().toLocaleString()}</p>
          <p>This report contains your financial data for the period ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `
}