'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Target, DollarSign, Calendar, Tag } from 'lucide-react'
import { useToast } from '@/components/Toast'

const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  categoryId: z.string().optional(),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface Category {
  id: string
  name: string
  color: string
}

interface BudgetFormProps {
  onClose: () => void
  onSuccess: () => void
  budget?: {
    id: string
    name: string
    amount: number
    period: 'monthly' | 'weekly' | 'yearly'
    categoryId?: string | null
  } | null
}

export default function BudgetForm({ onClose, onSuccess, budget }: BudgetFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      amount: 0,
      period: 'monthly',
      categoryId: '',
    },
  })

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
    
    // If editing an existing budget, populate the form
    if (budget) {
      reset({
        name: budget.name,
        amount: budget.amount,
        period: budget.period,
        categoryId: budget.categoryId || '',
      })
    }
  }, [budget, reset, fetchCategories])

  const onSubmit = async (data: BudgetFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const url = budget ? `/api/budgets/${budget.id}` : '/api/budgets'
      const method = budget ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const action = budget ? 'updated' : 'created'
        addToast({
          type: 'success',
          title: `Budget ${action.charAt(0).toUpperCase() + action.slice(1)} Successfully!`,
          message: `Your budget "${data.name}" has been ${action}.`,
        })
        onSuccess()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to ${budget ? 'update' : 'create'} budget`
        setError(errorMessage)
        addToast({
          type: 'error',
          title: `Failed to ${budget ? 'Update' : 'Create'} Budget`,
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error('Budget operation error:', error)
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
            {budget ? 'Edit Budget' : 'Create Budget'}
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
              Budget Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Target className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('name')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter budget name"
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
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
              Period *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...register('period')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            {errors.period && (
              <p className="text-red-600 text-sm mt-1">{errors.period.message}</p>
            )}
          </div>

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
                  {isLoadingCategories ? 'Loading categories...' : 'All Categories'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Leave empty to apply to all categories
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
              {isLoading ? (budget ? 'Updating...' : 'Creating...') : (budget ? 'Update Budget' : 'Create Budget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
