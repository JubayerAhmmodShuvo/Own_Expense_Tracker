'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

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
  currency?: string
  itemsPerPage?: number
}

export default function ExpenseList({ period, currency = 'BDT', itemsPerPage = 5 }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/expenses?period=${period}&page=${currentPage}&limit=${itemsPerPage}`)
      const result = await response.json()
      
      if (result.data) {
        // Paginated response
        setExpenses(result.data)
        setTotalPages(result.pagination?.pages || 1)
        setTotalCount(result.pagination?.total || 0)
      } else {
        // Direct array response (fallback)
        const allExpenses = result
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setExpenses(allExpenses.slice(startIndex, endIndex))
        setTotalPages(Math.ceil(allExpenses.length / itemsPerPage))
        setTotalCount(allExpenses.length)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [period, currentPage, itemsPerPage])

  const handleRefresh = () => {
    setCurrentPage(1)
    fetchExpenses()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      fetchExpenses()
    }
    
    window.addEventListener('refreshExpenseList', handleRefreshEvent)
    
    return () => {
      window.removeEventListener('refreshExpenseList', handleRefreshEvent)
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
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('refreshTransactions'))
        // Reset to first page if current page becomes empty
        if (expenses.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
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
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No expenses found for this period.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} total expenses</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
          title="Refresh expenses"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: expense.category?.color || '#6B7280' }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {expense.category?.name || 'Uncategorized'} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  -{formatCurrency(expense.amount, currency)}
                </span>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} expenses
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
