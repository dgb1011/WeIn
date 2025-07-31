import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    await notificationService.sendSessionNotifications(sessionId)

    return NextResponse.json({ 
      success: true,
      message: 'Session notifications scheduled successfully'
    })
  } catch (error) {
    console.error('Error sending session notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send session notifications' },
      { status: 500 }
    )
  }
} 