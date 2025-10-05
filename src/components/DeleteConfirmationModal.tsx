'use client'

import { AlertTriangle, X } from 'lucide-react'

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
  userId: string
  createdAt: string
  updatedAt: string
}

interface DeleteConfirmationModalProps {
  transaction: Transaction | null
  onClose: () => void
  onConfirm: (transaction: Transaction) => void
  isLoading?: boolean
}

export default function DeleteConfirmationModal({ 
  transaction, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: DeleteConfirmationModalProps) {
  if (!transaction) return null

  const handleConfirm = () => {
    onConfirm(transaction)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete {transaction.type === 'expense' ? 'Expense' : 'Income'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this {transaction.type}? This action cannot be undone.
            </p>
            
            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Amount:</span>
                <span className={`text-sm font-semibold ${
                  transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}৳{transaction.amount.toLocaleString()}
                </span>
              </div>
              
              {transaction.description && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <span className="text-sm text-gray-900">{transaction.description}</span>
                </div>
              )}
              
              {transaction.type === 'expense' && transaction.category && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: transaction.category.color }}
                    ></div>
                    <span className="text-sm text-gray-900">{transaction.category.name}</span>
                  </div>
                </div>
              )}
              
              {transaction.type === 'income' && transaction.source && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Source:</span>
                  <span className="text-sm text-gray-900">{transaction.source}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Date:</span>
                <span className="text-sm text-gray-900">{formatDate(transaction.date)}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
