'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'

interface Income {
  id: string
  amount: number
  description?: string
  source?: string
  date: string
}

interface IncomeListProps {
  period: string
}

export default function IncomeList({ period }: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIncomes = useCallback(async () => {
    try {
      const response = await fetch(`/api/incomes?period=${period}`)
      const data = await response.json()
      setIncomes(data.slice(0, 10)) // Show only recent 10
    } catch (error) {
      console.error('Error fetching incomes:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefresh = () => {
      fetchIncomes()
    }
    
    window.addEventListener('refreshIncomeList', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshIncomeList', handleRefresh)
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
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (incomes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No income found for this period.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {incomes.map((income) => (
        <div key={income.id} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {income.description || income.source || 'No description'}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(income.date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-green-600">
                +৳{income.amount.toLocaleString()}
              </span>
              <button
                onClick={() => handleDelete(income.id)}
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
