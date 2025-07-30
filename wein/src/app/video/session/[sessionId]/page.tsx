'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VideoRoom from '@/components/video/VideoRoom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'

export default function VideoSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    initializeSession()
  }, [sessionId])

  const initializeSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check authentication
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      // Get session data
      const sessionResponse = await fetch(`/api/consultants?action=sessionHistory&sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to load session data')
      }

      const sessionResult = await sessionResponse.json()
      setSessionData(sessionResult.sessions[0])

      // Create video room
      const roomResponse = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'createRoom',
          sessionId,
          recordingEnabled: true,
          maxParticipants: 2,
          quality: '720p'
        })
      })

      if (!roomResponse.ok) {
        throw new Error('Failed to create video room')
      }

      const roomResult = await roomResponse.json()
      setRoomId(roomResult.room.roomId)
      setIsLoading(false)

    } catch (err) {
      console.error('Error initializing session:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize session')
      setIsLoading(false)
    }
  }

  const handleLeave = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <CardTitle>Initializing Video Session</CardTitle>
            <p className="text-gray-600 text-center">
              Setting up your EMDR consultation session...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600" />
            <CardTitle>Session Error</CardTitle>
            <p className="text-red-600 text-center">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={initializeSession} variant="outline">
                Retry
              </Button>
              <Button onClick={handleLeave}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-yellow-600" />
            <CardTitle>Room Not Ready</CardTitle>
            <p className="text-gray-600 text-center">
              Video room is not available. Please try again.
            </p>
            <Button onClick={initializeSession} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <VideoRoom
      roomId={roomId}
      sessionId={sessionId}
      onLeave={handleLeave}
      isHost={true}
    />
  )
} 