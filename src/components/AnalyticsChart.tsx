'use client'

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsChartProps {
  data: Record<string, { amount: number; color: string }> | {
    expenses: Record<string, number>
    incomes: Record<string, number>
  } | undefined
  type: 'pie' | 'line'
}

export default function AnalyticsChart({ data, type }: AnalyticsChartProps) {
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  if (type === 'pie') {
    const pieData = Object.entries(data).map(([name, value]) => ({
      name,
      value: value.amount,
      color: value.color,
    }))

    if (pieData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No expenses by category
        </div>
      )
    }

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === 'line') {
    const { expenses, incomes } = data as { expenses: Record<string, number>; incomes: Record<string, number> }
    
    // Get all unique dates
    const allDates = new Set([
      ...Object.keys(expenses),
      ...Object.keys(incomes)
    ])
    
    const sortedDates = Array.from(allDates).sort()
    
    const lineData = sortedDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      expenses: expenses[date] || 0,
      incomes: incomes[date] || 0,
    }))

    if (lineData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No daily data available
        </div>
      )
    }

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number, name: string) => [
                `৳${value.toLocaleString()}`, 
                name === 'expenses' ? 'Expenses' : 'Income'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              name="expenses"
            />
            <Line 
              type="monotone" 
              dataKey="incomes" 
              stroke="#10B981" 
              strokeWidth={2}
              name="incomes"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
