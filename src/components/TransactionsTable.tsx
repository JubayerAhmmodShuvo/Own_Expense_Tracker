'use client'

import { useState, useEffect } from 'react'
import { Edit2, Trash2, Plus, Minus, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/Toast'
import EditTransactionModal from '@/components/EditTransactionModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

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

interface TransactionsTableProps {
  onRefresh: () => void
  period?: string
  customDateRange?: {
    startDate: string
    endDate: string
  } | null
}

export default function TransactionsTable({ onRefresh, period, customDateRange }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Filter and pagination state
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const recordsPerPage = 15
  
  const { addToast } = useToast()

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefresh = () => {
      fetchTransactions()
    }
    
    window.addEventListener('refreshTransactions', handleRefresh)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Reset to first page when filter or date range changes
    setCurrentPage(1)
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, period, customDateRange])

  useEffect(() => {
    // Fetch transactions when page changes (but don't reset page)
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      })

      // Add period parameter if provided
      if (period && period !== 'custom') {
        params.append('period', period)
      }

      // Add custom date range if provided
      if (customDateRange && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate)
        params.append('endDate', customDateRange.endDate)
      }
      
      // Fetch both expenses and incomes with pagination
      const [expensesResponse, incomesResponse] = await Promise.all([
        fetch(`/api/expenses?${params}`),
        fetch(`/api/incomes?${params}`)
      ])

      if (expensesResponse.ok && incomesResponse.ok) {
        const expensesData = await expensesResponse.json()
        const incomesData = await incomesResponse.json()

        // Extract data from paginated response
        const expenses = expensesData.data || expensesData // Handle both paginated and non-paginated responses
        const incomes = incomesData.data || incomesData

        // Transform and combine data
        const expenseTransactions: Transaction[] = expenses.map((expense: Record<string, unknown>) => ({
          ...expense,
          type: 'expense' as const,
        }))

        const incomeTransactions: Transaction[] = incomes.map((income: Record<string, unknown>) => ({
          ...income,
          type: 'income' as const,
        }))

        // Combine and filter data
        let allTransactions = [...expenseTransactions, ...incomeTransactions]
        
        // Apply filter
        if (filter !== 'all') {
          allTransactions = allTransactions.filter(t => t.type === filter)
        }

        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(allTransactions)
        
        // Calculate pagination info
        const total = allTransactions.length
        setTotalRecords(total)
        setTotalPages(Math.ceil(total / recordsPerPage))
        
      } else {
        addToast({
          type: 'error',
          title: 'Failed to Load Transactions',
          message: 'Please refresh the page and try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load transactions. Please check your connection.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditing(true)
  }

  const handleFilterChange = (newFilter: 'all' | 'expense' | 'income') => {
    setFilter(newFilter)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getPaginationInfo = () => {
    const startRecord = (currentPage - 1) * recordsPerPage + 1
    const endRecord = Math.min(currentPage * recordsPerPage, totalRecords)
    return { startRecord, endRecord }
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisiblePages = 5
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
    )
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      )
    }
    
    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    )
    
    return buttons
  }

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction)
  }

  const handleConfirmDelete = async (transaction: Transaction) => {
    setIsDeleting(true)

    try {
      const endpoint = transaction.type === 'expense' ? '/api/expenses' : '/api/incomes'
      const response = await fetch(`${endpoint}/${transaction.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: `${transaction.type === 'expense' ? 'Expense' : 'Income'} Deleted`,
          message: `৳${transaction.amount.toLocaleString()} has been removed successfully.`,
        })
        fetchTransactions()
        onRefresh() // Refresh dashboard data
        setDeletingTransaction(null)
      } else {
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete the transaction. Please try again.',
        })
      }
        } catch (error) {
          console.error('Delete error:', error)
          addToast({
            type: 'error',
            title: 'Network Error',
            message: 'Failed to delete transaction. Please try again.',
          })
        } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDelete = () => {
    setDeletingTransaction(null)
  }

  const handleCloseEdit = () => {
    setEditingTransaction(null)
  }

  const handleSaveEdit = async (updatedTransaction: Transaction) => {
    try {
      const endpoint = updatedTransaction.type === 'expense' ? '/api/expenses' : '/api/incomes'
      const response = await fetch(`${endpoint}/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: updatedTransaction.amount,
          description: updatedTransaction.description,
          date: updatedTransaction.date,
          ...(updatedTransaction.type === 'expense' 
            ? { categoryId: updatedTransaction.categoryId }
            : { source: updatedTransaction.source }
          ),
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: `${updatedTransaction.type === 'expense' ? 'Expense' : 'Income'} Updated`,
          message: `৳${updatedTransaction.amount.toLocaleString()} has been updated successfully.`,
        })
        fetchTransactions()
        onRefresh() // Refresh dashboard data
        setIsEditing(false)
        setEditingTransaction(null)
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update the transaction. Please try again.',
        })
      }
        } catch (error) {
          console.error('Update error:', error)
          addToast({
            type: 'error',
            title: 'Network Error',
            message: 'Failed to update transaction. Please try again.',
          })
        }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTypeIcon = (type: 'expense' | 'income') => {
    return type === 'expense' ? (
      <Minus className="h-4 w-4 text-red-500" />
    ) : (
      <Plus className="h-4 w-4 text-green-500" />
    )
  }

  const getTypeColor = (type: 'expense' | 'income') => {
    return type === 'expense' ? 'text-red-600' : 'text-green-600'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
              <p className="text-sm text-gray-500">Manage your expenses and income</p>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value as 'all' | 'expense' | 'income')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="expense">Expenses Only</option>
                  <option value="income">Income Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No transactions found' 
                : `No ${filter}s found`
              }
            </p>
            <p className="text-sm text-gray-400">
              {filter === 'all' 
                ? 'Add your first expense or income to get started' 
                : `Try changing the filter or add a new ${filter}`
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
            <p className="text-sm text-gray-500">Manage your expenses and income</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value as 'all' | 'expense' | 'income')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Pagination Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing {getPaginationInfo().startRecord} to {getPaginationInfo().endRecord} of {totalRecords} transactions
          </div>
          <div className="flex items-center space-x-2">
            {renderPaginationButtons()}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category/Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTypeIcon(transaction.type)}
                    <span className="ml-2 text-sm font-medium capitalize">
                      {transaction.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${getTypeColor(transaction.type)}`}>
                    {transaction.type === 'expense' ? '-' : '+'}৳{transaction.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {transaction.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.type === 'expense' ? (
                    transaction.category ? (
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: transaction.category.color }}
                        ></div>
                        <span className="text-sm text-gray-900">{transaction.category.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No category</span>
                    )
                  ) : (
                    <span className="text-sm text-gray-900">{transaction.source || '-'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditing && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
        <DeleteConfirmationModal
          transaction={deletingTransaction}
          onClose={handleCloseDelete}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
