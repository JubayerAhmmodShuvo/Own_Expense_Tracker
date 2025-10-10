'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <RefreshCw className="h-16 w-16 text-green-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Back Online!</h1>
          <p className="text-gray-600 mb-6">
            Your connection has been restored. Redirecting you back to the app...
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
        <WifiOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-6">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can still view your cached data.
        </p>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What you can do:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• View your dashboard and recent transactions</li>
              <li>• Browse your budget goals and recurring transactions</li>
              <li>• Access charts and analytics</li>
              <li>• Prepare new transactions (will sync when online)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Limited functionality:</h3>
            <ul className="text-sm text-yellow-800 space-y-1 text-left">
              <li>• Cannot add new transactions</li>
              <li>• Cannot edit existing data</li>
              <li>• Cannot import/export data</li>
              <li>• Some features may not work</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Retry
            </button>
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Continue Offline
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
