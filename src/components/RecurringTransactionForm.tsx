'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Repeat, DollarSign, Calendar, Tag, FileText, Building } from 'lucide-react'
import { useToast } from '@/components/Toast'

const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  type: z.enum(['expense', 'income']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

type RecurringTransactionFormData = z.infer<typeof recurringTransactionSchema>

interface Category {
  id: string
  name: string
  color: string
}

interface RecurringTransactionFormProps {
  onClose: () => void
  onSuccess: () => void
  recurringTransaction?: {
    id: string
    name: string
    amount: number
    description?: string
    type: 'expense' | 'income'
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    categoryId?: string
    source?: string
    startDate: string
    endDate?: string
  } | null
}

export default function RecurringTransactionForm({ 
  onClose, 
  onSuccess, 
  recurringTransaction 
}: RecurringTransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<RecurringTransactionFormData>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      description: '',
      type: 'expense',
      frequency: 'monthly',
      categoryId: '',
      source: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  })

  const watchType = watch('type')

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        console.error('Failed to fetch categories:', response.status)
        setError('Failed to load categories. Please refresh the page.')
        addToast({
          type: 'error',
          title: 'Failed to Load Categories',
          message: 'Please refresh the page and try again.',
        })
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Failed to load categories. Please refresh the page.')
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to load categories. Please check your connection.',
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchCategories()
    
    // If editing an existing recurring transaction, populate the form
    if (recurringTransaction) {
      reset({
        name: recurringTransaction.name,
        amount: recurringTransaction.amount,
        description: recurringTransaction.description || '',
        type: recurringTransaction.type,
        frequency: recurringTransaction.frequency,
        categoryId: recurringTransaction.categoryId || '',
        source: recurringTransaction.source || '',
        startDate: recurringTransaction.startDate.split('T')[0],
        endDate: recurringTransaction.endDate ? recurringTransaction.endDate.split('T')[0] : '',
      })
    }
  }, [recurringTransaction, reset, fetchCategories])

  const onSubmit = async (data: RecurringTransactionFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const url = recurringTransaction 
        ? `/api/recurring-transactions/${recurringTransaction.id}` 
        : '/api/recurring-transactions'
      const method = recurringTransaction ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const action = recurringTransaction ? 'updated' : 'created'
        addToast({
          type: 'success',
          title: `Recurring Transaction ${action.charAt(0).toUpperCase() + action.slice(1)} Successfully!`,
          message: `Your recurring ${data.type} "${data.name}" has been ${action}.`,
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to ${recurringTransaction ? 'update' : 'create'} recurring transaction`
        setError(errorMessage)
        addToast({
          type: 'error',
          title: `Failed to ${recurringTransaction ? 'Update' : 'Create'} Recurring Transaction`,
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error('Recurring transaction operation error:', error)
      const errorMessage = 'An error occurred. Please try again.'
      setError(errorMessage)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {recurringTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Repeat className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('name')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="e.g., Rent, Netflix Subscription"
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="expense"
                  {...register('type')}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Expense</span>
              </label>
              <label className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="income"
                  {...register('type')}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Income</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...register('frequency')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            {errors.frequency && (
              <p className="text-red-600 text-sm mt-1">{errors.frequency.message}</p>
            )}
          </div>

          {watchType === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('categoryId')}
                  disabled={isLoadingCategories}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {watchType === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('source')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="e.g., Salary, Freelance"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('description')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter description"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                {...register('startDate')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                {...register('endDate')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Leave empty for indefinite recurring transactions
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (recurringTransaction ? 'Updating...' : 'Creating...') : (recurringTransaction ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
