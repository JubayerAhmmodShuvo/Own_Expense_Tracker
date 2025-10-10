'use client'

import { useState } from 'react'

export default function AdminSeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; admin?: { email: string; name: string; role: string } } | null>(null)
  const [error, setError] = useState('')

  const createAdminUser = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create admin user')
      }
    } catch (_err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white font-sofia-condensed">
            Admin Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 font-spline-mono">
            Create admin user for the expense tracker
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={createAdminUser}
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Admin User...' : 'Create Admin User'}
          </button>

          {result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md">
              <h3 className="font-semibold">Success!</h3>
              <p className="text-sm mt-1">{result.message}</p>
              {result.admin && (
                <div className="mt-2 text-sm">
                  <p><strong>Email:</strong> {result.admin.email}</p>
                  <p><strong>Name:</strong> {result.admin.name}</p>
                  <p><strong>Role:</strong> {result.admin.role}</p>
                </div>
              )}
              <div className="mt-3">
                <a
                  href="/admin/login"
                  className="text-sm underline hover:no-underline"
                >
                  Go to Admin Login →
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
              <h3 className="font-semibold">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="text-center">
            <a
              href="/dashboard"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Admin Credentials
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p><strong>Email:</strong> admin.expensetracker@jubayer.com</p>
                <p><strong>Password:</strong> @123456@#</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
