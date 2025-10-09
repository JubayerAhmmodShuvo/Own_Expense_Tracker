import { SUPPORTED_CURRENCIES, Currency } from '@/types'

export function formatCurrency(amount: number, currencyCode: string = 'BDT'): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0]
  return `${currency.symbol}${amount.toLocaleString()}`
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  const fromCurr = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0]
  const toCurr = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency) || SUPPORTED_CURRENCIES[0]
  
  // Convert to base currency (BDT) first, then to target currency
  const baseAmount = amount / fromCurr.rate
  return baseAmount * toCurr.rate
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0]
  return currency.symbol
}

export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0]
  return currency.name
}

export function getAllCurrencies(): Currency[] {
  return SUPPORTED_CURRENCIES
}
