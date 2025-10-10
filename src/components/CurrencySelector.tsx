'use client'

import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { getAllCurrencies } from '@/lib/currency'
import { useToast } from '@/components/Toast'

interface CurrencySelectorProps {
  currentCurrency: string
  onCurrencyChange: (currency: string) => void
}

export default function CurrencySelector({ currentCurrency, onCurrencyChange }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { addToast } = useToast()

  const currencies = getAllCurrencies()

  const handleCurrencyChange = async (currencyCode: string) => {
    if (currencyCode === currentCurrency) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/user/currency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: currencyCode }),
      })

      if (response.ok) {
        onCurrencyChange(currencyCode)
        addToast({
          type: 'success',
          title: 'Currency Updated',
          message: `Your default currency has been changed to ${currencyCode}.`,
        })
        setIsOpen(false)
      } else {
        throw new Error('Failed to update currency')
      }
    } catch (error) {
      console.error('Currency update error:', error)
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update currency. Please try again.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const currentCurrencyData = currencies.find(c => c.code === currentCurrency) || currencies[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Globe className="h-4 w-4" />
        <span>{currentCurrencyData.symbol} {currentCurrencyData.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              Select Currency
            </div>
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleCurrencyChange(currency.code)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{currency.symbol}</span>
                  <div className="text-left">
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                  </div>
                </div>
                {currency.code === currentCurrency && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
