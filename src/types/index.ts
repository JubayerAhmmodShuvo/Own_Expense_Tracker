export interface User {
  id: string
  email: string
  name: string
  password?: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface ExtendedUser {
  id: string
  email: string
  name: string | null
  password?: string
  currency: string
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Expense {
  id: string
  amount: number
  description: string | null
  date: Date
  userId: string
  categoryId: string | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
  category?: Category | null
}

export interface Income {
  id: string
  amount: number
  description: string | null
  source: string | null
  date: Date
  userId: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsData {
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
  expenses: Expense[]
  incomes: Income[]
}

export interface ExpenseFormData {
  amount: number
  description?: string
  date: string
  categoryId?: string
}

export interface IncomeFormData {
  amount: number
  description?: string
  source?: string
  date: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
}

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface DailyChartData {
  date: string
  expenses: number
  incomes: number
}

export interface Budget {
  id: string
  name: string
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  categoryId: string | null
  userId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category?: Category | null
}

export interface BudgetFormData {
  name: string
  amount: number
  period: 'monthly' | 'weekly' | 'yearly'
  categoryId?: string
}

export interface BudgetProgress {
  budgetId: string
  budgetName: string
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentage: number
  isOverBudget: boolean
  category?: Category | null
}

export interface RecurringTransaction {
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
  category?: Category | null
}

export interface RecurringTransactionFormData {
  name: string
  amount: number
  description?: string
  type: 'expense' | 'income'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  categoryId?: string
  source?: string
  startDate: string
  endDate?: string
}

export interface Tag {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface TagFormData {
  name: string
  color?: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  rate: number // Exchange rate to base currency (BDT)
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.0091 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.0084 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.0072 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 0.76 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 1.35 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 0.012 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 0.014 },
]
