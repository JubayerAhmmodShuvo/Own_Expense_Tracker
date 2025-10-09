'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Target, 
  DollarSign, 
  Calendar, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import BudgetForm from './BudgetForm'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface Budget {
  id: string
  name: string
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  categoryId: string | null
  userId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category?: {
    id: string
    name: string
    color: string
  } | null
  progress?: {
    spentAmount: number
    remainingAmount: number
    percentage: number
    isOverBudget: boolean
  }
}

export default function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null)
  const { addToast } = useToast()

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/budgets?includeProgress=true')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      } else {
        console.error('Failed to fetch budgets:', response.status)
        addToast({
          type: 'error',
          title: 'Failed to Load Budgets',
          message: 'Please refresh the page and try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load budgets. Please check your connection.',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      fetchBudgets()
    }
    
    window.addEventListener('refreshTransactions', handleRefreshEvent)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefreshEvent)
    }
  }, [fetchBudgets])

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Budget Deleted',
          message: 'Your budget has been deleted successfully.',
        })
        fetchBudgets()
        setDeleteBudget(null)
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Delete Budget',
          message: errorData.error || 'An error occurred while deleting the budget.',
        })
      }
    } catch (error) {
      console.error('Delete budget error:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete budget. Please try again.',
      })
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'per week'
      case 'monthly': return 'per month'
      case 'yearly': return 'per year'
      default: return period
    }
  }

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Budget Goals</h3>
          <button
            onClick={() => setShowBudgetForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Budget</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Budgets Yet</h4>
            <p className="text-gray-600 mb-4">
              Create your first budget to start tracking your spending goals.
            </p>
            <button
              onClick={() => setShowBudgetForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Budget
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{budget.name}</h4>
                      {budget.category && (
                        <span 
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: budget.category.color }}
                        >
                          {budget.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>৳{budget.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{getPeriodLabel(budget.period)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingBudget(budget)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteBudget(budget)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {budget.progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-600">
                          Spent: ৳{budget.progress.spentAmount.toLocaleString()}
                        </span>
                        <span className="text-gray-600">
                          Remaining: ৳{budget.progress.remainingAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-1 font-medium ${
                        getProgressTextColor(budget.progress.percentage, budget.progress.isOverBudget)
                      }`}>
                        {budget.progress.isOverBudget && (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <span>{budget.progress.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                          budget.progress.percentage,
                          budget.progress.isOverBudget
                        )}`}
                        style={{ width: `${Math.min(budget.progress.percentage, 100)}%` }}
                      />
                    </div>

                    {budget.progress.isOverBudget && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>Over budget by ৳{Math.abs(budget.progress.remainingAmount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <BudgetForm
          onClose={() => {
            setShowBudgetForm(false)
            setEditingBudget(null)
          }}
          onSuccess={() => {
            setShowBudgetForm(false)
            setEditingBudget(null)
            fetchBudgets()
          }}
          budget={editingBudget}
        />
      )}

      {/* Edit Budget Modal */}
      {editingBudget && !showBudgetForm && (
        <BudgetForm
          onClose={() => setEditingBudget(null)}
          onSuccess={() => {
            setEditingBudget(null)
            fetchBudgets()
          }}
          budget={editingBudget}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteBudget && (
        <DeleteConfirmationModal
          isOpen={!!deleteBudget}
          onClose={() => setDeleteBudget(null)}
          onConfirm={() => handleDeleteBudget(deleteBudget.id)}
          title="Delete Budget"
          message={`Are you sure you want to delete the budget "${deleteBudget.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  )
}
