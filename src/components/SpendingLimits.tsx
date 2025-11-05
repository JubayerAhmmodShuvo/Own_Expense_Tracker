'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, AlertTriangle, DollarSign } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { formatCurrency } from '@/lib/currency'

interface SpendingLimit {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string
  monthlyLimit: number
  currentSpending: number
  remaining: number
  percentage: number
  isOverLimit: boolean
}

interface Category {
  id: string
  name: string
  color: string
}

interface SpendingLimitsProps {
  currency?: string
}

export default function SpendingLimits({ currency = 'BDT' }: SpendingLimitsProps) {
  const [spendingLimits, setSpendingLimits] = useState<SpendingLimit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const { addToast } = useToast()

  const fetchSpendingLimits = useCallback(async () => {
    try {
      const response = await fetch('/api/spending-limits')
      const data = await response.json()
      setSpendingLimits(data)
    } catch (error) {
      console.error('Error fetching spending limits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchSpendingLimits()
    fetchCategories()
  }, [fetchSpendingLimits, fetchCategories])

  useEffect(() => {
    // Listen for refresh events
    const handleRefresh = () => {
      fetchSpendingLimits()
    }
    
    window.addEventListener('refreshTransactions', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh)
    }
  }, [fetchSpendingLimits])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCategory || !monthlyLimit) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select a category and enter a monthly limit.',
      })
      return
    }

    try {
      const response = await fetch('/api/spending-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: selectedCategory,
          monthlyLimit: parseFloat(monthlyLimit),
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Spending Limit Set',
          message: 'Monthly spending limit has been set successfully!',
        })
        setShowForm(false)
        setSelectedCategory('')
        setMonthlyLimit('')
        fetchSpendingLimits()
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Set Limit',
          message: error.error || 'Failed to set spending limit.',
        })
      }
    } catch (error) {
      console.error('Error setting spending limit:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while setting the spending limit.',
      })
    }
  }

  const handleDelete = async (limitId: string) => {
    if (!confirm('Are you sure you want to delete this spending limit?')) {
      return
    }

    try {
      const response = await fetch(`/api/spending-limits/${limitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Limit Deleted',
          message: 'Spending limit has been deleted successfully.',
        })
        fetchSpendingLimits()
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Delete',
          message: 'Failed to delete spending limit.',
        })
      }
    } catch (error) {
      console.error('Error deleting spending limit:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'An error occurred while deleting the spending limit.',
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Limits</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly spending caps by category</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Set Limit</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {spendingLimits.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No spending limits set</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Set limits to track your monthly spending</p>
          </div>
        ) : (
          <div className="space-y-4">
            {spendingLimits.map((limit) => (
              <div
                key={limit.id}
                className={`p-4 rounded-lg border ${
                  limit.isOverLimit
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: limit.categoryColor }}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {limit.categoryName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(limit.currentSpending, currency)} / {formatCurrency(limit.monthlyLimit, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {limit.isOverLimit && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <button
                      onClick={() => handleDelete(limit.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {limit.isOverLimit ? 'Over limit by' : 'Remaining'}
                    </span>
                    <span className={`font-medium ${
                      limit.isOverLimit ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(Math.abs(limit.remaining), currency)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        limit.isOverLimit
                          ? 'bg-red-500'
                          : limit.percentage > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(limit.percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    {limit.percentage.toFixed(1)}% of limit
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Limit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Set Monthly Spending Limit
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Limit ({currency})
                  </label>
                  <input
                    type="number"
                    value={monthlyLimit}
                    onChange={(e) => setMonthlyLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter monthly limit"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setSelectedCategory('')
                      setMonthlyLimit('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Set Limit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
