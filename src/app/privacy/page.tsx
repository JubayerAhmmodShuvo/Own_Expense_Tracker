'use client'

import { useState } from 'react'
import { Shield, Lock, Eye, Database, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'

export default function PrivacyPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const { addToast } = useToast()

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/export?type=all&format=json')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `expense-tracker-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        addToast({
          type: 'success',
          title: 'Data Exported',
          message: 'Your data has been successfully exported.',
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

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true)
      const response = await fetch('/api/backup?format=json')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        addToast({
          type: 'success',
          title: 'Backup Created',
          message: 'Your complete backup has been created successfully.',
        })
      } else {
        throw new Error('Backup failed')
      }
    } catch (error) {
      console.error('Backup error:', error)
      addToast({
        type: 'error',
        title: 'Backup Failed',
        message: 'Failed to create backup. Please try again.',
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      addToast({
        type: 'error',
        title: 'Invalid Confirmation',
        message: 'Please type "DELETE" to confirm account deletion.',
      })
      return
    }

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Account Deleted',
          message: 'Your account and all data have been permanently deleted.',
        })
        // Redirect to home page
        window.location.href = '/'
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete account. Please try again.',
      })
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy & Data</h1>
              <p className="text-sm text-gray-600">Your data, your control</p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Privacy Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Privacy Policy</h2>
          </div>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              We take your privacy seriously. This page explains how we handle your financial data and what rights you have.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">Encrypted Storage</h3>
                <p className="text-sm text-green-700">All data is encrypted at rest and in transit</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900">No Tracking</h3>
                <p className="text-sm text-blue-700">We don't track you or sell your data</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-900">Your Control</h3>
                <p className="text-sm text-purple-700">Export, backup, or delete anytime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-8 w-8 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Export Your Data</h3>
                  <p className="text-sm text-gray-600">Download all your transactions and settings</p>
                </div>
              </div>
              <button 
                onClick={handleExportData}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export All Data'}
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Create Backup</h3>
                  <p className="text-sm text-gray-600">Generate a complete backup of your account</p>
                </div>
              </div>
              <button 
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingBackup ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Trash2 className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Data Collection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Data We Collect</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-gray-900">Account Information</h3>
              <p className="text-sm text-gray-600">Name, email address, and authentication data</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-gray-900">Financial Data</h3>
              <p className="text-sm text-gray-600">Expenses, income, categories, budgets, and recurring transactions</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-gray-900">Usage Data</h3>
              <p className="text-sm text-gray-600">App usage patterns and performance metrics (anonymized)</p>
            </div>
          </div>
        </div>

        {/* Data Usage */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Data</h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Provide Services</h3>
                <p className="text-sm text-gray-600">To deliver expense tracking and financial management features</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Improve Experience</h3>
                <p className="text-sm text-gray-600">To enhance app performance and user experience</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Security</h3>
                <p className="text-sm text-gray-600">To protect your account and prevent fraud</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">We Never Share Your Financial Data</h3>
            <p className="text-sm text-red-700">
              Your financial information is never shared with third parties, advertisers, or marketing companies. 
              We don't sell your data or use it for advertising purposes.
            </p>
          </div>
          
          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-900">Limited Sharing Only For:</h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Legal compliance when required by law</li>
              <li>• Service providers who help us operate the app (under strict confidentiality)</li>
              <li>• Your explicit consent for specific features</li>
            </ul>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Access</h3>
              <p className="text-sm text-gray-600">View all your personal data we have</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Rectification</h3>
              <p className="text-sm text-gray-600">Correct inaccurate or incomplete data</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Erasure</h3>
              <p className="text-sm text-gray-600">Request deletion of your personal data</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Portability</h3>
              <p className="text-sm text-gray-600">Export your data in a machine-readable format</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions or Concerns?</h2>
          <p className="text-gray-600 mb-4">
            If you have any questions about this privacy policy or how we handle your data, 
            please contact us at privacy@expensetracker.com
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This action cannot be undone. This will permanently delete your account and all associated data including:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• All expenses and income records</li>
                  <li>• Categories, budgets, and recurring transactions</li>
                  <li>• Tags and custom settings</li>
                  <li>• Account information</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
