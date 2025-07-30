'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
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
  Record,
  Square,
  MessageSquare,
  Users
} from 'lucide-react'

interface VideoControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isRecording: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleRecording: () => void
  onLeave: () => void
  onToggleChat?: () => void
  onToggleParticipants?: () => void
  onSettings?: () => void
  showChat?: boolean
  showParticipants?: boolean
}

export default function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onLeave,
  onToggleChat,
  onToggleParticipants,
  onSettings,
  showChat = false,
  showParticipants = false
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 border-t border-gray-700">
      {/* Audio Control */}
      <Button
        variant={isAudioEnabled ? "default" : "destructive"}
        size="lg"
        onClick={onToggleAudio}
        className="rounded-full w-12 h-12"
        title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      {/* Video Control */}
      <Button
        variant={isVideoEnabled ? "default" : "destructive"}
        size="lg"
        onClick={onToggleVideo}
        className="rounded-full w-12 h-12"
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      {/* Screen Share Control */}
      <Button
        variant={isScreenSharing ? "destructive" : "secondary"}
        size="lg"
        onClick={onToggleScreenShare}
        className="rounded-full w-12 h-12"
        title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </Button>

      {/* Recording Control */}
      <Button
        variant={isRecording ? "destructive" : "secondary"}
        size="lg"
        onClick={onToggleRecording}
        className="rounded-full w-12 h-12"
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? <Square className="h-5 w-5" /> : <Record className="h-5 w-5" />}
      </Button>

      {/* Chat Toggle */}
      {onToggleChat && (
        <Button
          variant={showChat ? "default" : "secondary"}
          size="lg"
          onClick={onToggleChat}
          className="rounded-full w-12 h-12"
          title="Toggle chat"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {/* Participants Toggle */}
      {onToggleParticipants && (
        <Button
          variant={showParticipants ? "default" : "secondary"}
          size="lg"
          onClick={onToggleParticipants}
          className="rounded-full w-12 h-12"
          title="Toggle participants list"
        >
          <Users className="h-5 w-5" />
        </Button>
      )}

      {/* Settings */}
      {onSettings && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onSettings}
          className="rounded-full w-12 h-12 text-white hover:bg-gray-700"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      )}

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="lg"
        onClick={onLeave}
        className="rounded-full w-12 h-12"
        title="Leave call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  )
} 