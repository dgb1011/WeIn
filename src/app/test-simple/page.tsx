'use client'

import { useState } from 'react'

export default function TestSimplePage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      console.log('Testing simple API call...')
      const response = await fetch('/api/test', {
        method: 'GET',
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('API test error:', error)
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuthAPI = async () => {
    setLoading(true)
    setResult('Testing auth...')
    
    try {
      console.log('Testing auth API call...')
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email: 'test@example.com',
          password: 'password123'
        }),
      })

      console.log('Auth response status:', response.status)
      const data = await response.json()
      console.log('Auth response data:', data)
      
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Auth API test error:', error)
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Basic API</h2>
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 mr-4"
          >
            {loading ? 'Testing...' : 'Test Basic API'}
          </button>
          
          <button
            onClick={testAuthAPI}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth API'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Response:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Test Basic API" to check if the server is working</li>
            <li>Click "Test Auth API" to check if authentication is working</li>
            <li>Check the browser console for any errors</li>
            <li>Look at the response below</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 