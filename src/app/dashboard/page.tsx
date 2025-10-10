'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Plus,
  Filter,
  LogOut,
  Shield,
  Settings
} from 'lucide-react'
import ExpenseForm from '@/components/ExpenseForm'
import IncomeForm from '@/components/IncomeForm'
import ExpenseList from '@/components/ExpenseList'
import IncomeList from '@/components/IncomeList'
import AnalyticsChart from '@/components/AnalyticsChart'
import TransactionsTable from '@/components/TransactionsTable'
import BudgetList from '@/components/BudgetList'
import RecurringTransactionList from '@/components/RecurringTransactionList'
import ImportExportManager from '@/components/ImportExportManager'
import CurrencySelector from '@/components/CurrencySelector'
import SpendingInsights from '@/components/SpendingInsights'
import QuickAdd from '@/components/QuickAdd'
import TransactionSearch from '@/components/TransactionSearch'
import SearchResults from '@/components/SearchResults'
import SpendingLimits from '@/components/SpendingLimits'
import PDFExport from '@/components/PDFExport'
import { formatCurrency } from '@/lib/currency'
import ThemeToggle from '@/components/ThemeToggle'

interface SearchResult {
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

interface AnalyticsData {
  summary: {
    totalExpenses: number
    totalIncomes: number
    netIncome: number
    expenseCount: number
    incomeCount: number
  }
  expensesByCategory: Record<string, { amount: number; color: string }>
  dailyData: {
    expenses: Record<string, number>
    incomes: Record<string, number>
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [userCurrency, setUserCurrency] = useState('BDT')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  
  // Date range state
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [isCustomRange, setIsCustomRange] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchAnalytics = useCallback(async () => {
    try {
      let url = `/api/analytics?period=${period}`
      
      // Add custom date range parameters if custom range is selected
      if (isCustomRange && customDateRange.startDate && customDateRange.endDate) {
        url += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set default analytics data when there's an error
      setAnalytics({
        summary: {
          totalExpenses: 0,
          totalIncomes: 0,
          netIncome: 0,
          expenseCount: 0,
          incomeCount: 0,
        },
        expensesByCategory: {},
        dailyData: {
          expenses: {},
          incomes: {},
        },
      })
    } finally {
      setLoading(false)
    }
  }, [period, isCustomRange, customDateRange])

  useEffect(() => {
    if (session) {
      fetchAnalytics()
    }
  }, [session, period, customDateRange, isCustomRange, fetchAnalytics])

  useEffect(() => {
    // Listen for refresh events from other components
    const handleRefreshEvent = () => {
      fetchAnalytics()
    }
    
    window.addEventListener('refreshTransactions', handleRefreshEvent)
    
    return () => {
      window.removeEventListener('refreshTransactions', handleRefreshEvent)
    }
  }, [fetchAnalytics])

  const handleSignOut = () => {
    signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    })
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    if (newPeriod === 'custom') {
      setIsCustomRange(true)
    } else {
      setIsCustomRange(false)
      setCustomDateRange({ startDate: '', endDate: '' })
    }
  }

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sofia-condensed">Expense Tracker</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-spline-mono">Welcome back, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <PDFExport 
                period={period} 
                customDateRange={isCustomRange ? customDateRange : null} 
              />
              <ThemeToggle />
              <CurrencySelector
                currentCurrency={userCurrency}
                onCurrencyChange={setUserCurrency}
              />
              <Link
                href="/privacy"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span>Privacy</span>
              </Link>
              {(session.user as { role?: string })?.role === 'admin' || (session.user as { role?: string })?.role === 'super_admin' ? (
                <Link
                  href="/admin/login"
                  className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Admin</span>
                </Link>
              ) : null}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Period Filter */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {isCustomRange && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsCustomRange(false)
                      setCustomDateRange({ startDate: '', endDate: '' })
                      setPeriod('month')
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.summary?.totalIncomes || 0, userCurrency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.summary?.totalExpenses || 0, userCurrency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${
                (analytics?.summary?.netIncome || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`h-6 w-6 ${
                  (analytics?.summary?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Income</p>
                <p className={`text-2xl font-bold ${
                  (analytics?.summary?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(analytics?.summary?.netIncome || 0, userCurrency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(analytics?.summary?.expenseCount || 0) + (analytics?.summary?.incomeCount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
          <button
            onClick={() => setShowExpenseForm(true)}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setShowIncomeForm(true)}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Income</span>
          </button>
        </div>

        {/* Spending Insights */}
        <div className="mb-8">
          <SpendingInsights currency={userCurrency} />
        </div>

        {/* Quick Add */}
        <div className="mb-8">
          <QuickAdd 
            onExpenseAdded={fetchAnalytics}
            currency={userCurrency}
          />
        </div>

        {/* Transaction Search */}
        <div className="mb-8">
          <TransactionSearch 
            onSearchResults={setSearchResults}
            currency={userCurrency}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <SearchResults 
              transactions={searchResults}
              currency={userCurrency}
              onDelete={(id) => {
                setSearchResults(prev => prev.filter(t => t.id !== id))
              }}
            />
          </div>
        )}

        {/* Budget Goals and Spending Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          <BudgetList />
          <SpendingLimits currency={userCurrency} />
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-sofia-condensed">Expenses by Category</h3>
            <AnalyticsChart data={analytics?.expensesByCategory} type="pie" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-sofia-condensed">Daily Overview</h3>
            <AnalyticsChart data={analytics?.dailyData} type="line" />
          </div>
        </div>

        {/* Recurring Transactions */}
        <div className="mb-8">
          <RecurringTransactionList />
        </div>

        {/* Import/Export */}
        <div className="mb-8">
          <ImportExportManager />
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <TransactionsTable 
            onRefresh={fetchAnalytics} 
            period={period}
            customDateRange={isCustomRange ? customDateRange : null}
          />
        </div>

        {/* Separate Lists for Reference */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <ExpenseList period={period} currency={userCurrency} itemsPerPage={5} />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <IncomeList period={period} currency={userCurrency} itemsPerPage={5} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSuccess={() => {
            setShowExpenseForm(false)
            fetchAnalytics()
            // Force refresh of transactions table and lists
            window.dispatchEvent(new CustomEvent('refreshTransactions'))
            window.dispatchEvent(new CustomEvent('refreshExpenseList'))
            window.dispatchEvent(new CustomEvent('refreshIncomeList'))
          }}
        />
      )}

      {showIncomeForm && (
        <IncomeForm
          onClose={() => setShowIncomeForm(false)}
          onSuccess={() => {
            setShowIncomeForm(false)
            fetchAnalytics()
            // Force refresh of transactions table and lists
            window.dispatchEvent(new CustomEvent('refreshTransactions'))
            window.dispatchEvent(new CustomEvent('refreshExpenseList'))
            window.dispatchEvent(new CustomEvent('refreshIncomeList'))
          }}
        />
      )}
      </div>
    </div>
  )
}

