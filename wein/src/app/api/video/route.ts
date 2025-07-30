import { NextRequest, NextResponse } from 'next/server'
import { VideoService } from '@/lib/services/videoService'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'createRoom') {
      const { sessionId, recordingEnabled = true, maxParticipants = 2, quality = '720p' } = data
      
      const room = await VideoService.createVideoRoom(sessionId, {
        recordingEnabled,
        maxParticipants,
        quality
      })

      return NextResponse.json({ room })
    }

    if (action === 'joinRoom') {
      const { roomId } = data
      
      const videoSession = await VideoService.joinVideoRoom(
        roomId, 
        user.id, 
        user.userType.toLowerCase() as 'student' | 'consultant' | 'admin'
      )

      return NextResponse.json({ 
        session: videoSession,
        roomId,
        joinUrl: videoSession.joinUrl
      })
    }

    if (action === 'leaveRoom') {
      const { roomId } = data
      
      await VideoService.leaveVideoRoom(roomId, user.id)
      return NextResponse.json({ message: 'Successfully left video room' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Video API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'session') {
      const sessionId = searchParams.get('sessionId')
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
      }

      const videoSession = await VideoService.getVideoSession(sessionId)
      return NextResponse.json({ session: videoSession })
    }

    if (action === 'analytics') {
      const sessionId = searchParams.get('sessionId')
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
      }

      const analytics = await VideoService.getSessionAnalytics(sessionId)
      return NextResponse.json({ analytics })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Video API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 