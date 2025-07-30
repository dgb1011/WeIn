'use client'

import React, { useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react'

interface VideoParticipantProps {
  participant: {
    id: string
    userId: string
    userType: 'student' | 'consultant' | 'admin'
    isLocal: boolean
    stream?: MediaStream
    audioEnabled: boolean
    videoEnabled: boolean
    screenSharing: boolean
  }
  isMainView?: boolean
  className?: string
}

export default function VideoParticipant({ 
  participant, 
  isMainView = false,
  className = ""
}: VideoParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  const getParticipantLabel = () => {
    if (participant.isLocal) {
      return 'You'
    }
    return participant.userType.charAt(0).toUpperCase() + participant.userType.slice(1)
  }

  const getParticipantColor = () => {
    switch (participant.userType) {
      case 'student':
        return 'bg-blue-600'
      case 'consultant':
        return 'bg-green-600'
      case 'admin':
        return 'bg-purple-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`w-full h-full object-cover rounded-lg ${
          isMainView ? 'bg-gray-800' : 'bg-gray-700'
        }`}
      />

      {/* Video Disabled Overlay */}
      {!participant.videoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
          <div className="text-center">
            <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {participant.isLocal ? 'Your camera is off' : 'Camera is off'}
            </p>
          </div>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        {/* Participant Avatar/Initial */}
        <div className={`w-8 h-8 ${getParticipantColor()} rounded-full flex items-center justify-center`}>
          <span className="text-white text-sm font-medium">
            {participant.userType.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Participant Name */}
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {getParticipantLabel()}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {/* Audio Status */}
        <div className={`p-1 rounded-full ${
          participant.audioEnabled ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {participant.audioEnabled ? (
            <Mic className="h-3 w-3 text-white" />
          ) : (
            <MicOff className="h-3 w-3 text-white" />
          )}
        </div>

        {/* Screen Sharing Indicator */}
        {participant.screenSharing && (
          <div className="bg-blue-500 p-1 rounded-full">
            <Monitor className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Local Indicator */}
      {participant.isLocal && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          You
        </div>
      )}

      {/* Connection Quality Indicator (Mock) */}
      {!participant.isLocal && (
        <div className="absolute bottom-4 right-4 flex space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
    </div>
  )
} 