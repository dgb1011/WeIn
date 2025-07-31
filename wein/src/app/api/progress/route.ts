import { NextRequest, NextResponse } from 'next/server'
import { ProgressService } from '@/lib/services/progressService'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'overview') {
      const progress = await ProgressService.getStudentProgress(user.id)
      return NextResponse.json({ progress })
    }

    if (action === 'analytics') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined

      const analytics = await ProgressService.getProgressAnalytics(user.id, dateRange)
      return NextResponse.json({ analytics })
    }

    if (action === 'milestones') {
      const milestones = await ProgressService.getMilestoneProgress(user.id)
      return NextResponse.json({ milestones })
    }

    if (action === 'weekly') {
      const weeks = parseInt(searchParams.get('weeks') || '12')
      const weeklyProgress = await ProgressService.getWeeklyProgress(user.id, weeks)
      return NextResponse.json({ weeklyProgress })
    }

    if (action === 'sessionHistory') {
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')
      const status = searchParams.get('status')?.split(',')

      const progress = await ProgressService.getStudentProgress(user.id, {
        includePending: true
      })

      let sessionHistory = progress.sessionHistory

      // Apply filters
      if (status && status.length > 0) {
        sessionHistory = sessionHistory.filter(session => status.includes(session.status))
      }

      // Apply pagination
      const paginatedHistory = sessionHistory.slice(offset, offset + limit)

      return NextResponse.json({
        sessions: paginatedHistory,
        total: sessionHistory.length,
        hasMore: offset + limit < sessionHistory.length
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Progress API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'updateProgress') {
      const progress = await ProgressService.updateProgress(user.id)
      return NextResponse.json({ progress })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Progress API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 