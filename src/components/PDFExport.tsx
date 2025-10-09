'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
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
        throw new Error('Failed to generate PDF')
      }

      const data = await response.json()
      
      // Create a blob from the HTML content
      const blob = new Blob([data.pdfContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = url
      link.download = data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'PDF Generated',
        message: 'Your expense report has been downloaded successfully!',
      })

    } catch (error) {
      console.error('PDF export error:', error)
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to generate PDF report. Please try again.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handlePDFExport}
      disabled={isGenerating}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      <span>{isGenerating ? 'Generating...' : 'Export PDF'}</span>
    </button>
  )
}
