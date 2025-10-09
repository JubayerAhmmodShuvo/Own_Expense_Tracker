'use client'

import { useState } from 'react'
import { Plus, Zap, Coffee, Car, ShoppingCart, Utensils, Home, Gamepad2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface QuickAddProps {
  onExpenseAdded: () => void
  currency?: string
}

interface QuickExpense {
  id: string
  name: string
  amount: number
  category: string
  icon: React.ReactNode
  color: string
}

const quickExpenses: QuickExpense[] = [
  { id: 'coffee', name: 'Coffee', amount: 150, category: 'Food & Drinks', icon: <Coffee className="h-4 w-4" />, color: 'bg-amber-500' },
  { id: 'lunch', name: 'Lunch', amount: 300, category: 'Food & Drinks', icon: <Utensils className="h-4 w-4" />, color: 'bg-orange-500' },
  { id: 'transport', name: 'Transport', amount: 100, category: 'Transportation', icon: <Car className="h-4 w-4" />, color: 'bg-blue-500' },
  { id: 'groceries', name: 'Groceries', amount: 500, category: 'Shopping', icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-green-500' },
  { id: 'utilities', name: 'Utilities', amount: 2000, category: 'Bills & Utilities', icon: <Home className="h-4 w-4" />, color: 'bg-purple-500' },
  { id: 'entertainment', name: 'Entertainment', amount: 400, category: 'Entertainment', icon: <Gamepad2 className="h-4 w-4" />, color: 'bg-pink-500' },
]

export default function QuickAdd({ onExpenseAdded, currency = 'BDT' }: QuickAddProps) {
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const { addToast } = useToast()

  const handleQuickAdd = async (expense: QuickExpense) => {
    setIsAdding(expense.id)
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: expense.amount,
          description: expense.name,
          date: new Date().toISOString(),
          categoryId: null, // Will be auto-categorized or user can set later
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Expense Added',
          message: `${expense.name} expense of ${expense.amount} ${currency} added successfully!`,
        })
        onExpenseAdded()
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('refreshTransactions'))
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Add Expense',
          message: error.error || 'Failed to add expense. Please try again.',
        })
      }
    } catch (error) {
      console.error('Error adding expense:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while adding the expense.',
      })
    } finally {
      setIsAdding(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Add</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">One-click common expenses</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickExpenses.map((expense) => (
          <button
            key={expense.id}
            onClick={() => handleQuickAdd(expense)}
            disabled={isAdding === expense.id}
            className={`relative p-4 rounded-lg border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-md group ${
              isAdding === expense.id ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`p-2 rounded-full ${expense.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                {expense.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{expense.amount} {currency}</p>
              </div>
            </div>
            
            {isAdding === expense.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Quick add buttons create expenses with today's date. You can edit them later to change the amount, category, or date.
        </p>
      </div>
    </div>
  )
}
