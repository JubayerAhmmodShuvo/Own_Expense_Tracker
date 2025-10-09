'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface Income {
  id: string
  amount: number
  description?: string
  source?: string
  date: string
}

interface IncomeListProps {
  period: string
  currency?: string
  itemsPerPage?: number
}

export default function IncomeList({ period, currency = 'BDT', itemsPerPage = 5 }: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/incomes?period=${period}&page=${currentPage}&limit=${itemsPerPage}`)
      const result = await response.json()
      
      if (result.data) {
        // Paginated response
        setIncomes(result.data)
        setTotalPages(result.pagination?.pages || 1)
        setTotalCount(result.pagination?.total || 0)
      } else {
        // Direct array response (fallback)
        const allIncomes = result
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        setIncomes(allIncomes.slice(startIndex, endIndex))
        setTotalPages(Math.ceil(allIncomes.length / itemsPerPage))
        setTotalCount(allIncomes.length)
      }
    } catch (error) {
      console.error('Error fetching incomes:', error)
    } finally {
      setLoading(false)
    }
  }, [period, currentPage, itemsPerPage])

  const handleRefresh = () => {
    setCurrentPage(1)
    fetchIncomes()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      fetchIncomes()
    }
    
    window.addEventListener('refreshIncomeList', handleRefreshEvent)
    
    return () => {
      window.removeEventListener('refreshIncomeList', handleRefreshEvent)
    }
  }, [fetchIncomes])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income?')) {
      return
    }

    try {
      const response = await fetch(`/api/incomes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIncomes(incomes.filter(income => income.id !== id))
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('refreshTransactions'))
        // Reset to first page if current page becomes empty
        if (incomes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
      } else {
        alert('Failed to delete income')
      }
    } catch (error) {
      console.error('Error deleting income:', error)
      alert('An error occurred while deleting the income')
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

  if (incomes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <p>No income found for this period.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Income</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} total income records</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
          title="Refresh income"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {incomes.map((income) => (
          <div key={income.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {income.description || income.source || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(income.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +{formatCurrency(income.amount, currency)}
                </span>
                <button
                  onClick={() => handleDelete(income.id)}
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} income records
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
