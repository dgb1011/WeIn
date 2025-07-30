'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: string
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('StudentDashboard: useEffect running')
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    console.log('StudentDashboard: Token exists:', !!token)
    console.log('StudentDashboard: User data exists:', !!userData)

    if (!token || !userData) {
      console.log('StudentDashboard: No auth data, redirecting to login')
      router.push('/auth/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      console.log('StudentDashboard: Parsed user data:', parsedUser)
      setUser(parsedUser)
    } catch (error) {
      console.error('StudentDashboard: Error parsing user data:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    console.log('StudentDashboard: Logging out')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isLoading) {
    console.log('StudentDashboard: Loading state')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('StudentDashboard: No user data')
    return null
  }

  console.log('StudentDashboard: Rendering dashboard for user:', user)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.firstName}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your EMDR Consultation Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Hours Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">40</div>
              <div className="text-sm text-gray-600">Hours Required</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0%</div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Book Consultation</h3>
            <p className="text-gray-600 mb-4">Schedule your next EMDR consultation session</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Book Session
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">View Sessions</h3>
            <p className="text-gray-600 mb-4">Check your upcoming and past sessions</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              View Sessions
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-center py-8">
            <p className="text-gray-600">No recent activity to display</p>
            <p className="text-sm text-gray-500 mt-2">Start by booking your first consultation session</p>
          </div>
        </div>
      </div>
    </div>
  )
} 