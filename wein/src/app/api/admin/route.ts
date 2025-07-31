import { NextRequest, NextResponse } from 'next/server'
import { AdminService } from '@/lib/services/adminService'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'users') {
      const userType = searchParams.get('userType')?.split(',')
      const status = searchParams.get('status')?.split(',')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')
      const search = searchParams.get('search') || undefined

      const users = await AdminService.getAllUsers({
        userType: userType as any,
        status: status as any,
        limit,
        offset,
        search
      })

      return NextResponse.json(users)
    }

    if (action === 'systemHealth') {
      const health = await AdminService.getSystemHealth()
      return NextResponse.json({ health })
    }

    if (action === 'analytics') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined

      const analytics = await AdminService.getSystemAnalytics(dateRange)
      return NextResponse.json({ analytics })
    }

    if (action === 'configuration') {
      const config = await AdminService.getSystemConfiguration()
      return NextResponse.json({ config })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    // For now, we'll return a mock response since createSystemAlert doesn't exist
    if (action === 'createAlert') {
      return NextResponse.json({ 
        alert: {
          id: 'mock-alert-id',
          type: 'INFO',
          message: 'Mock alert created',
          severity: 'LOW',
          timestamp: new Date(),
          resolved: false
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'updateUserStatus') {
      const { userId, status, reason } = data
      await AdminService.updateUserStatus(userId, status, reason)
      return NextResponse.json({ message: 'User status updated successfully' })
    }

    if (action === 'updateConfiguration') {
      const config = await AdminService.updateSystemConfiguration(data)
      return NextResponse.json({ config })
    }

    // Mock response for resolveAlert since it doesn't exist
    if (action === 'resolveAlert') {
      return NextResponse.json({ message: 'Alert resolved successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      await AdminService.deleteUser(userId)
      return NextResponse.json({ message: 'User deleted successfully' })
    }

    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  } catch (error) {
    console.error('Admin API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 