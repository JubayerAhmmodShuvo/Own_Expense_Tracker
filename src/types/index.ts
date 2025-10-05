export interface User {
  id: string
  email: string
  name: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

export interface ExtendedUser {
  id: string
  email: string
  name: string | null
  password?: string
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
