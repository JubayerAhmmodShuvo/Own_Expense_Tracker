'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, Info, DollarSign, Calendar, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface SpendingInsight {
  id: string
  type: 'increase' | 'decrease' | 'warning' | 'achievement'
  title: string
  message: string
  percentage?: number
  amount?: number
  category?: string
  icon: React.ReactNode
  color: string
}

interface SpendingInsightsProps {
  currency?: string
}

export default function SpendingInsights({ currency = 'BDT' }: SpendingInsightsProps) {
  const [insights, setInsights] = useState<SpendingInsight[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/insights')
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  useEffect(() => {
    // Listen for refresh events
    const handleRefresh = () => {
      fetchInsights()
    }
    
    window.addEventListener('refreshTransactions', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh)
    }
  }, [fetchInsights])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-5 w-5" />
      case 'decrease':
        return <TrendingDown className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'achievement':
        return <Target className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'decrease':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'achievement':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
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

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No insights available</h3>
          <p className="text-gray-500 dark:text-gray-400">Add more transactions to get personalized insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Insights</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personalized financial insights and recommendations</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-90">{insight.message}</p>
                  {insight.percentage && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs font-medium">
                        {insight.percentage > 0 ? '+' : ''}{insight.percentage.toFixed(1)}%
                      </span>
                      {insight.amount && (
                        <span className="text-xs">
                          ({formatCurrency(Math.abs(insight.amount), currency)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Monthly Summary</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Insights are updated daily based on your spending patterns. 
                Keep tracking to get more personalized recommendations!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
