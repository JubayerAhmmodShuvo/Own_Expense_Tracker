'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2
} from 'lucide-react'
import DeleteUserModal from '@/components/DeleteUserModal'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalRevenue: number
  systemLoad: {
    cpu: number
    memory: number
    disk: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    severity: 'info' | 'warning' | 'error'
  }>
  userGrowth: Array<{
    date: string
    users: number
    transactions: number
  }>
  topUsers: Array<{
    id: string
    name: string
    email: string
    transactionCount: number
    totalAmount: number
    totalExpenseAmount: number
    totalIncomeAmount: number
    createdAt: string
    lastActive: string | null
    currency: string
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    uptime: string
    responseTime: number
    errorRate: number
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    user: { id: string; name: string; email: string; transactionCount: number } | null
  }>({
    isOpen: false,
    user: null
  })
  const [deleting, setDeleting] = useState(false)

  const fetchAdminStats = useCallback(async () => {
    try {
      setRefreshing(true)
      // console.log('Fetching admin stats...')
      const response = await fetch(`/api/admin/stats?range=${selectedTimeRange}`)
      // console.log('Admin stats response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        // console.log('Admin stats data:', data)
        setStats(data)
      } else {
        const errorData = await response.json()
        // console.error('Admin stats error:', errorData)
      }
    } catch (error) {
      // console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedTimeRange])

  // Check if user is admin and fetch stats
  useEffect(() => {
    // console.log('Admin page useEffect - status:', status)
    // console.log('Admin page useEffect - session:', session)
    // console.log('Admin page useEffect - session.user:', session?.user)
    // console.log('Admin page useEffect - session.user.role:', (session?.user as { role?: string })?.role)
    
    if (status === 'loading') {
      // console.log('Status is loading, waiting...')
      return
    }
    
    if (!session) {
      // console.log('No session, redirecting to login')
      router.push('/admin/login')
      return
    }
    
    // console.log('Session user role:', (session.user as { role?: string })?.role)
    if ((session.user as { role?: string })?.role !== 'admin' && (session.user as { role?: string })?.role !== 'super_admin') {
      //      console.log('User is not admin, redirecting to login')
      router.push('/admin/login')
      return
    }

    // console.log('User is admin, fetching stats...')
    // Only fetch stats if user is authenticated and is admin
    fetchAdminStats()
  }, [session, status, router, selectedTimeRange, fetchAdminStats])

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      if (response.ok) {
        fetchAdminStats() // Refresh data
      }
    } catch (error) {
      console.error('Error performing user action:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' })
      })
      
      if (response.ok) {
        setDeleteModal({ isOpen: false, user: null })
        fetchAdminStats() // Refresh data
      } else {
        console.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (user: { id: string; name: string; email: string; transactionCount: number }) => {
    setDeleteModal({ isOpen: true, user })
  }

  const exportData = async (type: 'users' | 'transactions' | 'analytics') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || ((session.user as { role?: string })?.role !== 'admin' && (session.user as { role?: string })?.role !== 'super_admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-sofia-condensed">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-spline-mono">
                System Overview & Management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <button
                onClick={fetchAdminStats}
                disabled={refreshing}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  signOut({ 
                    callbackUrl: '/admin/login',
                    redirect: true 
                  })
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Status */}
        {stats?.systemHealth && (
          <div className={`mb-8 p-4 rounded-lg border ${
            stats.systemHealth.status === 'healthy' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : stats.systemHealth.status === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                stats.systemHealth.status === 'healthy' 
                  ? 'bg-green-100 dark:bg-green-800' 
                  : stats.systemHealth.status === 'warning'
                  ? 'bg-yellow-100 dark:bg-yellow-800'
                  : 'bg-red-100 dark:bg-red-800'
              }`}>
                <Activity className={`h-5 w-5 ${
                  stats.systemHealth.status === 'healthy' 
                    ? 'text-green-600 dark:text-green-400' 
                    : stats.systemHealth.status === 'warning'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Status: {stats.systemHealth.status.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Uptime: {stats.systemHealth.uptime} | 
                  Response Time: {stats.systemHealth.responseTime}ms | 
                  Error Rate: {stats.systemHealth.errorRate}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.activeUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.totalTransactions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Load</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.systemLoad.cpu || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-sofia-condensed">
              System Resources
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>CPU Usage</span>
                  <span>{stats?.systemLoad.cpu || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats?.systemLoad.cpu || 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Memory Usage</span>
                  <span>{stats?.systemLoad.memory || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats?.systemLoad.memory || 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Disk Usage</span>
                  <span>{stats?.systemLoad.disk || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats?.systemLoad.disk || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-sofia-condensed">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {stats?.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    activity.severity === 'error' 
                      ? 'bg-red-100 dark:bg-red-900' 
                      : activity.severity === 'warning'
                      ? 'bg-yellow-100 dark:bg-yellow-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    <AlertTriangle className={`h-3 w-3 ${
                      activity.severity === 'error' 
                        ? 'text-red-600 dark:text-red-400' 
                        : activity.severity === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-sofia-condensed">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => exportData('users')}
                className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Export User Data</span>
              </button>
              <button
                onClick={() => exportData('transactions')}
                className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Export Transactions</span>
              </button>
              <button
                onClick={() => exportData('analytics')}
                className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Export Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-sofia-condensed">
              Top Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats?.topUsers && stats.topUsers.length > 0 ? (
                  stats.topUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.transactionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${(user.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Activate User"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'deactivate')}
                          className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title="Deactivate User"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Users will appear here once they start using the application.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        user={deleteModal.user}
        loading={deleting}
      />
    </div>

  )
  
}
