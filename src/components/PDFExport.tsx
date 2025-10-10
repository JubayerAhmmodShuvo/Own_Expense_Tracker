'use client'

import { useState } from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface PDFExportProps {
  period: string
  customDateRange?: {
    startDate: string
    endDate: string
  } | null
}

export default function PDFExport({ period, customDateRange }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { addToast } = useToast()

  const handlePDFExport = async () => {
    try {
      setIsGenerating(true)
      
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period,
          customDateRange,
          format: 'pdf'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      const data = await response.json()
      
      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Unable to open print window. Please allow popups.')
      }

      // Write the HTML content to the new window
      printWindow.document.write(data.htmlContent)
      printWindow.document.close()

      // Wait for the content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }

      addToast({
        type: 'success',
        title: 'PDF Ready',
        message: 'Your expense report is ready to print/save as PDF!',
      })

    } catch (error) {
      console.error('PDF export error:', error)
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handlePDFExport}
      disabled={isGenerating}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      <span>{isGenerating ? 'Generating...' : 'Export PDF'}</span>
    </button>
  )
}