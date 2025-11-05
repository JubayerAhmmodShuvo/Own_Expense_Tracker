'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Repeat, 
  DollarSign, 
  Calendar, 
  Edit, 
  Trash2, 
  Plus,
  Play,
  Pause,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/components/Toast'
import RecurringTransactionForm from './RecurringTransactionForm'
import GenericDeleteModal from './GenericDeleteModal'

interface RecurringTransaction {
  id: string
  name: string
  amount: number
  description: string | null
  type: 'expense' | 'income'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  categoryId: string | null
  source: string | null
  startDate: Date
  endDate: Date | null
  nextDueDate: Date
  isActive: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  category?: {
    id: string
    name: string
    color: string
  } | null
}

export default function RecurringTransactionList() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null)
  const [deleteTransaction, setDeleteTransaction] = useState<RecurringTransaction | null>(null)
  const [processingTransaction, setProcessingTransaction] = useState<string | null>(null)
  const { addToast } = useToast()

  const fetchRecurringTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recurring-transactions')
      if (response.ok) {
        const data = await response.json()
        setRecurringTransactions(data)
      } else if (response.status === 401) {
        // Handle unauthorized - don't show error toast for auth issues
        // console.log('User not authenticated for recurring transactions')
        setRecurringTransactions([])
      } else {
        console.error('Failed to fetch recurring transactions:', response.status)
        addToast({
          type: 'error',
          title: 'Failed to Load Recurring Transactions',
          message: 'Please refresh the page and try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching recurring transactions:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load recurring transactions. Please check your connection.',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchRecurringTransactions()
  }, [fetchRecurringTransactions])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      fetchRecurringTransactions()
    }
    
    window.addEventListener('refreshTransactions', handleRefreshEvent)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefreshEvent)
    }
  }, [fetchRecurringTransactions])

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/recurring-transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Recurring Transaction Deleted',
          message: 'Your recurring transaction has been deleted successfully.',
        })
        fetchRecurringTransactions()
        setDeleteTransaction(null)
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Delete Recurring Transaction',
          message: errorData.error || 'An error occurred while deleting the transaction.',
        })
      }
    } catch (error) {
      console.error('Delete recurring transaction error:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to delete recurring transaction. Please try again.',
      })
    }
  }

  const handleProcessTransaction = async (transactionId: string) => {
    try {
      setProcessingTransaction(transactionId)
      const response = await fetch('/api/recurring-transactions/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recurringTransactionId: transactionId }),
      })

      if (response.ok) {
        const data = await response.json()
        addToast({
          type: 'success',
          title: 'Transaction Processed',
          message: `Successfully created ${data.transaction.type} of ৳${data.transaction.amount.toLocaleString()}`,
        })
        fetchRecurringTransactions()
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('refreshTransactions'))
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Process Transaction',
          message: errorData.error || 'An error occurred while processing the transaction.',
        })
      }
    } catch (error) {
      console.error('Process recurring transaction error:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to process recurring transaction. Please try again.',
      })
    } finally {
      setProcessingTransaction(null)
    }
  }

  const handleToggleActive = async (transactionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/recurring-transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: `Recurring Transaction ${!isActive ? 'Activated' : 'Paused'}`,
          message: `Your recurring transaction has been ${!isActive ? 'activated' : 'paused'}.`,
        })
        fetchRecurringTransactions()
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Update Transaction',
          message: errorData.error || 'An error occurred while updating the transaction.',
        })
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to update recurring transaction. Please try again.',
      })
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'yearly': return 'Yearly'
      default: return frequency
    }
  }

  const getTypeColor = (type: string) => {
    return type === 'expense' ? 'text-red-600' : 'text-green-600'
  }

  // const getTypeIcon = (type: string) => {
  //   return type === 'expense' ? 'text-red-500' : 'text-green-500'
  // }

  const isDueToday = (nextDueDate: Date) => {
    const today = new Date()
    const dueDate = new Date(nextDueDate)
    return dueDate.toDateString() === today.toDateString()
  }

  const isOverdue = (nextDueDate: Date) => {
    const today = new Date()
    const dueDate = new Date(nextDueDate)
    return dueDate < today
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
          <h3 className="text-lg font-semibold text-gray-900">Recurring Transactions</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Recurring</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {recurringTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Recurring Transactions Yet</h4>
            <p className="text-gray-600 mb-4">
              Set up recurring transactions for rent, subscriptions, salary, and more.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Recurring Transaction
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringTransactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{transaction.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'expense' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type}
                      </span>
                      {transaction.category && (
                        <span 
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: transaction.category.color }}
                        >
                          {transaction.category.name}
                        </span>
                      )}
                      {!transaction.isActive && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className={`flex items-center space-x-1 ${getTypeColor(transaction.type)}`}>
                        <DollarSign className="h-4 w-4" />
                        <span>৳{transaction.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{getFrequencyLabel(transaction.frequency)}</span>
                      </div>
                      {transaction.source && (
                        <div className="flex items-center space-x-1">
                          <span>{transaction.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {transaction.isActive && (
                      <button
                        onClick={() => handleProcessTransaction(transaction.id)}
                        disabled={processingTransaction === transaction.id}
                        className="p-1 text-gray-400 hover:text-green-600 disabled:opacity-50"
                        title="Process Transaction"
                      >
                        {processingTransaction === transaction.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                      className={`p-1 cursor-pointer ${transaction.isActive ? 'text-gray-400 hover:text-yellow-600' : 'text-gray-400 hover:text-green-600'}`}
                      title={transaction.isActive ? 'Pause Transaction' : 'Activate Transaction'}
                    >
                      {transaction.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTransaction(transaction)}
                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Next due: {new Date(transaction.nextDueDate).toLocaleDateString()}
                    </span>
                    {isOverdue(transaction.nextDueDate) && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Overdue</span>
                      </div>
                    )}
                    {isDueToday(transaction.nextDueDate) && !isOverdue(transaction.nextDueDate) && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Due Today</span>
                      </div>
                    )}
                  </div>
                  {transaction.description && (
                    <span className="text-gray-500 text-xs truncate max-w-xs">
                      {transaction.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <RecurringTransactionForm
          onClose={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setEditingTransaction(null)
            fetchRecurringTransactions()
          }}
          recurringTransaction={editingTransaction}
        />
      )}

      {/* Edit Modal */}
      {editingTransaction && !showForm && (
        <RecurringTransactionForm
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            fetchRecurringTransactions()
          }}
          recurringTransaction={editingTransaction}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTransaction && (
        <GenericDeleteModal
          isOpen={!!deleteTransaction}
          onClose={() => setDeleteTransaction(null)}
          onConfirm={() => handleDeleteTransaction(deleteTransaction.id)}
          title="Delete Recurring Transaction"
          message={`Are you sure you want to delete the recurring transaction "${deleteTransaction.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  )
}
