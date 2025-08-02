'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login form submitted with:', { email, password })
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Making API request to /api/auth')
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'login',
        }),
      })

      console.log('API response status:', response.status)
      const data = await response.json()
      console.log('API response data:', data)

      if (response.ok) {
        console.log('Login successful, storing data and redirecting')
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        setSuccess('Login successful! Redirecting...')
        
        // Add a small delay to show success message
        setTimeout(() => {
          // Redirect based on user type
          switch (data.user.userType) {
            case 'STUDENT':
              console.log('Redirecting to student dashboard')
              window.location.href = '/dashboard/student'
              break
            case 'CONSULTANT':
              console.log('Redirecting to consultant dashboard')
              window.location.href = '/dashboard/consultant'
              break
            case 'ADMIN':
              console.log('Redirecting to admin dashboard')
              window.location.href = '/dashboard/admin'
              break
            default:
              console.log('Redirecting to default dashboard')
              window.location.href = '/dashboard'
          }
        }, 1000)
      } else {
        console.log('Login failed:', data.error)
        setError(data.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your BrainBased EMDR account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Create one here
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                Forgot your password?
              </Link>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 