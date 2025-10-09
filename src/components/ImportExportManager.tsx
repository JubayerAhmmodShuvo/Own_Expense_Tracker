'use client'

import { useState, useRef } from 'react'
import { 
  Download, 
  Upload, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  createdCategories: string[]
}

export default function ImportExportManager() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const handleExport = async (type: 'expenses' | 'incomes' | 'all', format: 'csv' | 'json') => {
    try {
      setIsExporting(true)
      
      const params = new URLSearchParams({
        type,
        format,
      })

      const response = await fetch(`/api/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const filename = response.headers.get('Content-Disposition')
          ?.split('filename=')[1]?.replace(/"/g, '') || `${type}.${format}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        addToast({
          type: 'success',
          title: 'Export Successful',
          message: `Your ${type} have been exported as ${format.toUpperCase()}.`,
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a CSV file.',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string
        const transactions = parseCSV(csvContent)
        
        if (transactions.length === 0) {
          addToast({
            type: 'error',
            title: 'No Data Found',
            message: 'The CSV file appears to be empty or invalid.',
          })
          return
        }

        setIsImporting(true)
        setShowImportModal(true)

        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions,
            createCategories: true,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          setImportResult(result.results)
          
          if (result.results.success > 0) {
            addToast({
              type: 'success',
              title: 'Import Successful',
              message: `Successfully imported ${result.results.success} transactions.`,
            })
            // Trigger refresh of transactions
            window.dispatchEvent(new CustomEvent('refreshTransactions'))
          }
        } else {
          const errorData = await response.json()
          addToast({
            type: 'error',
            title: 'Import Failed',
            message: errorData.error || 'Failed to import transactions.',
          })
        }
      } catch (error) {
        console.error('Import error:', error)
        addToast({
          type: 'error',
          title: 'Import Error',
          message: 'Failed to process the CSV file.',
        })
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsText(file)
  }

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const transactions = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length < headers.length) continue

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Determine transaction type and parse data
      let transactionType: 'expense' | 'income' = 'expense'
      let amount = 0
      let date = ''
      let description = ''
      let category = ''
      let source = ''

      // Handle different CSV formats
      if (row.type) {
        transactionType = row.type.toLowerCase() === 'income' ? 'income' : 'expense'
      } else if (row.category) {
        transactionType = 'expense'
      } else if (row.source) {
        transactionType = 'income'
      }

      amount = parseFloat(row.amount || row.value || '0')
      date = row.date || row.transaction_date || ''
      description = row.description || row.note || row.memo || ''
      category = row.category || ''
      source = row.source || ''

      if (amount > 0 && date) {
        transactions.push({
          type: transactionType,
          amount,
          description,
          date,
          category,
          source,
        })
      }
    }

    return transactions
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Import & Export</h3>
        <p className="text-sm text-gray-600 mt-1">
          Import transactions from CSV files or export your data for backup.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Export Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Data
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Export Type</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('expenses', 'csv')}
                  disabled={isExporting}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Expenses (CSV)
                </button>
                <button
                  onClick={() => handleExport('incomes', 'csv')}
                  disabled={isExporting}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Incomes (CSV)
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">All Data</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('all', 'csv')}
                  disabled={isExporting}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  All (CSV)
                </button>
                <button
                  onClick={() => handleExport('all', 'json')}
                  disabled={isExporting}
                  className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  All (JSON)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Data
          </h4>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Upload a CSV file to import transactions
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importing...' : 'Choose CSV File'}
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Required columns: amount, date</li>
                <li>• Optional columns: description, category, source, type</li>
                <li>• Date format: YYYY-MM-DD or MM/DD/YYYY</li>
                <li>• Amount should be numeric (no currency symbols)</li>
                <li>• Type should be "expense" or "income" (defaults to expense)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Import Results Modal */}
      {showImportModal && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
              <button
                onClick={closeImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">
                  Successfully imported: {importResult.success} transactions
                </span>
              </div>

              {importResult.failed > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">
                    Failed to import: {importResult.failed} transactions
                  </span>
                </div>
              )}

              {importResult.createdCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Created Categories:</h4>
                  <div className="flex flex-wrap gap-2">
                    {importResult.createdCategories.map((category, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={closeImportModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
