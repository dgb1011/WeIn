'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Phone,
  PhoneOff,
  Settings,
  MoreVertical,
  Users,
  MessageSquare,
  Record,
  Square
} from 'lucide-react'

interface VideoRoomProps {
  roomId: string
  sessionId: string
  onLeave: () => void
  isHost?: boolean
}

interface VideoParticipant {
  id: string
  userId: string
  userType: 'student' | 'consultant' | 'admin'
  isLocal: boolean
  stream?: MediaStream
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
}

export default function VideoRoom({ roomId, sessionId, onLeave, isHost = false }: VideoRoomProps) {
  const [participants, setParticipants] = useState<VideoParticipant[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [isRecording, setIsRecording] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  // WebRTC Configuration
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  }

  // Initialize video room
  useEffect(() => {
    initializeVideoRoom()
    return () => {
      cleanupVideoRoom()
    }
  }, [roomId])

  const initializeVideoRoom = async () => {
    try {
      setIsConnecting(true)
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      setLocalStream(stream)
      localStreamRef.current = stream

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(rtcConfiguration)
      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Set up event handlers
      peerConnection.onicecandidate = handleIceCandidate
      peerConnection.ontrack = handleRemoteTrack
      peerConnection.onconnectionstatechange = handleConnectionStateChange

      // Join room via API
      await joinRoom()

      setConnectionStatus('connected')
      setIsConnecting(false)

      // Add local participant
      setParticipants(prev => [...prev, {
        id: 'local',
        userId: 'local',
        userType: 'student',
        isLocal: true,
        stream,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false
      }])

    } catch (error) {
      console.error('Error initializing video room:', error)
      setConnectionStatus('disconnected')
      setIsConnecting(false)
    }
  }

  const joinRoom = async () => {
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'joinRoom',
          roomId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to join room')
      }

      const data = await response.json()
      console.log('Joined room:', data)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const cleanupVideoRoom = async () => {
    try {
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      // Leave room via API
      await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'leaveRoom',
          roomId
        })
      })
    } catch (error) {
      console.error('Error cleaning up video room:', error)
    }
  }

  // WebRTC Event Handlers
  const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      // In a real implementation, send the candidate to the remote peer
      console.log('ICE candidate:', event.candidate)
    }
  }

  const handleRemoteTrack = (event: RTCTrackEvent) => {
    console.log('Remote track received:', event.track.kind)
    
    if (event.track.kind === 'video' && remoteVideoRef.current) {
      const stream = new MediaStream([event.track])
      remoteVideoRef.current.srcObject = stream
      
      // Add remote participant
      setParticipants(prev => [...prev, {
        id: 'remote',
        userId: 'remote',
        userType: 'consultant',
        isLocal: false,
        stream,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false
      }])
    }
  }

  const handleConnectionStateChange = () => {
    if (peerConnectionRef.current) {
      setConnectionStatus(peerConnectionRef.current.connectionState as any)
    }
  }

  // Control Functions
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [])

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })

        screenStreamRef.current = screenStream

        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        )

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
        }

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }

        setIsScreenSharing(true)
      } else {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop())
          screenStreamRef.current = null
        }

        // Restore camera video
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }

        // Replace track back to camera
        const videoTrack = localStreamRef.current?.getVideoTracks()[0]
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track?.kind === 'video'
        )

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
        }

        setIsScreenSharing(false)
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
    }
  }, [isScreenSharing])

  const toggleRecording = useCallback(() => {
    setIsRecording(!isRecording)
    // In a real implementation, this would trigger recording start/stop
  }, [isRecording])

  const handleLeave = useCallback(async () => {
    await cleanupVideoRoom()
    onLeave()
  }, [onLeave])

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-lg font-medium">Connecting to video session...</p>
            <Badge variant={connectionStatus === 'connecting' ? 'secondary' : 'destructive'}>
              {connectionStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">EMDR Consultation Session</h1>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-gray-700"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-gray-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover bg-gray-800"
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Screen Share Indicator */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Screen Sharing
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Recording</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(showParticipants || showChat) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showParticipants && (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.userType.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          {participant.isLocal ? 'You' : participant.userType}
                        </p>
                        <div className="flex items-center space-x-2">
                          {participant.audioEnabled ? (
                            <Mic className="h-3 w-3 text-green-400" />
                          ) : (
                            <MicOff className="h-3 w-3 text-red-400" />
                          )}
                          {participant.videoEnabled ? (
                            <Video className="h-3 w-3 text-green-400" />
                          ) : (
                            <VideoOff className="h-3 w-3 text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showChat && (
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Chat</h3>
                <div className="bg-gray-700 rounded p-3 min-h-64">
                  <p className="text-gray-400 text-sm">Chat functionality coming soon...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 border-t border-gray-700">
        <Button
          variant={isAudioEnabled ? "default" : "destructive"}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-12 h-12"
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-12 h-12"
        >
          {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant={isScreenSharing ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
          className="rounded-full w-12 h-12"
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>

        <Button
          variant={isRecording ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleRecording}
          className="rounded-full w-12 h-12"
        >
          {isRecording ? <Square className="h-5 w-5" /> : <Record className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeave}
          className="rounded-full w-12 h-12"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 