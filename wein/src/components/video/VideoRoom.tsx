'use client'

import React, { useState, useEffect, useRef } from 'react'
import VideoControls from './VideoControls'
import VideoParticipant from './VideoParticipant'

interface VideoRoomProps {
  roomId: string
  sessionId: string
  onLeave: () => void
  isHost?: boolean
}

interface Participant {
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
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)

  useEffect(() => {
    initializeVideo()
    return () => {
      cleanupVideo()
    }
  }, [])

  const initializeVideo = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      })

      setLocalStream(stream)

      // Add local participant
      const localParticipant: Participant = {
        id: 'local',
        userId: 'local',
        userType: 'student', // This should come from user context
        isLocal: true,
        stream,
        audioEnabled: isAudioEnabled,
        videoEnabled: isVideoEnabled,
        screenSharing: false
      }

      setParticipants([localParticipant])
      setIsConnecting(false)

      // Join video room via API
      await joinVideoRoom()
    } catch (error) {
      console.error('Error initializing video:', error)
      setIsConnecting(false)
    }
  }

  const joinVideoRoom = async () => {
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

      if (response.ok) {
        const data = await response.json()
        console.log('Joined video room:', data)
      }
    } catch (error) {
      console.error('Error joining video room:', error)
    }
  }

  const cleanupVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        setIsScreenSharing(true)
        // Replace video track with screen share
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0]
          const screenTrack = screenStream.getVideoTracks()[0]
          localStream.removeTrack(videoTrack)
          localStream.addTrack(screenTrack)
        }
      } else {
        // Stop screen sharing and restore camera
        if (localStream) {
          const screenTrack = localStream.getVideoTracks()[0]
          localStream.removeTrack(screenTrack)
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
          const cameraTrack = cameraStream.getVideoTracks()[0]
          localStream.addTrack(cameraTrack)
        }
        setIsScreenSharing(false)
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // In a real implementation, this would start/stop recording via the video service
  }

  const handleLeave = async () => {
    try {
      // Leave video room via API
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
      console.error('Error leaving video room:', error)
    } finally {
      cleanupVideo()
      onLeave()
    }
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Connecting to video session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Video Area */}
      <div className="flex-1 relative">
        {participants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-white">No participants in the room</p>
          </div>
        ) : participants.length === 1 ? (
          // Single participant (local user)
          <div className="h-full">
            <VideoParticipant
              participant={participants[0]}
              isMainView={true}
              className="h-full"
            />
          </div>
        ) : (
          // Multiple participants
          <div className="grid grid-cols-2 gap-4 h-full p-4">
            {participants.map((participant, index) => (
              <VideoParticipant
                key={participant.id}
                participant={participant}
                isMainView={index === 0}
                className={index === 0 ? 'col-span-2' : ''}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Controls */}
      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={toggleRecording}
        onLeave={handleLeave}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        showChat={showChat}
        showParticipants={showParticipants}
      />
    </div>
  )
} 