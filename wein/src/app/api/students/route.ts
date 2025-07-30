import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/studentService'
import { getCurrentUser, requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'progress') {
      const progress = await StudentService.getStudentProgress(user.id)
      return NextResponse.json({ progress })
    }

    if (action === 'sessions') {
      const status = searchParams.get('status')?.split(',')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      const sessions = await StudentService.getStudentSessions(user.id, {
        status: status as any,
        limit,
        offset
      })

      return NextResponse.json(sessions)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Student API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, status } = body

    if (action === 'updateStatus' && status) {
      await StudentService.updateStudentStatus(user.id, status)
      return NextResponse.json({ message: 'Status updated successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Student API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 