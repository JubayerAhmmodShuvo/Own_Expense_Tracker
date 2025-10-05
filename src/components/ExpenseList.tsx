'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'

interface Expense {
  id: string
  amount: number
  description?: string
  date: string
  category?: {
    id: string
    name: string
    color: string
  }
}

interface ExpenseListProps {
  period: string
}

export default function ExpenseList({ period }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch(`/api/expenses?period=${period}`)
      const data = await response.json()
      setExpenses(data.slice(0, 10)) // Show only recent 10
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefresh = () => {
      fetchExpenses()
    }
    
    window.addEventListener('refreshExpenseList', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshExpenseList', handleRefresh)
    }
  }, [fetchExpenses])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExpenses(expenses.filter(expense => expense.id !== id))
      } else {
        alert('Failed to delete expense')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('An error occurred while deleting the expense')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No expenses found for this period.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {expenses.map((expense) => (
        <div key={expense.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: expense.category?.color || '#6B7280' }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {expense.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {expense.category?.name || 'Uncategorized'} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-red-600">
                -৳{expense.amount.toLocaleString()}
              </span>
              <button
                onClick={() => handleDelete(expense.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
