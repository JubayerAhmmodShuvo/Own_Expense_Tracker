'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Edit2, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface Transaction {
  id: string
  type: 'expense' | 'income'
  amount: number
  description?: string
  date: string
  categoryId?: string
  category?: {
    id: string
    name: string
    color: string
  }
  source?: string
}

interface SearchResultsProps {
  transactions: Transaction[]
  currency?: string
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: string) => void
}

export default function SearchResults({ transactions, currency = 'BDT', onEdit, onDelete }: SearchResultsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    setDeletingId(transactionId)
    try {
      const response = await fetch(`/api/${transactions.find(t => t.id === transactionId)?.type}s/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete?.(transactionId)
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('refreshTransactions'))
      } else {
        alert('Failed to delete transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('An error occurred while deleting the transaction')
    } finally {
      setDeletingId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Search Results ({transactions.length} transactions)
        </h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className={`h-4 w-4 ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                    ) : (
                      <TrendingDown className={`h-4 w-4 ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description || transaction.source || 'No description'}
                      </p>
                      {transaction.category && (
                        <div className="flex items-center space-x-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: transaction.category.color }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.category.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${
                  transaction.type === 'income' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                </span>
                
                <div className="flex items-center space-x-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deletingId === transaction.id}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete transaction"
                  >
                    {deletingId === transaction.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
