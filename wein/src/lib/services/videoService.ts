import { db } from '../db'

// Type definitions for the video service
type VideoQuality = '480p' | '720p' | '1080p'
type AudioQuality = 'low' | 'medium' | 'high'
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'failed'
type RecordingStatus = 'not_started' | 'recording' | 'paused' | 'stopped' | 'processing'

interface VideoRoom {
  id: string
  sessionId: string
  roomId: string
  joinUrl: string
  guestUrl: string
  recordingEnabled: boolean
  startTime: Date
  endTime?: Date
  maxParticipants: number
  currentParticipants: number
  status: 'active' | 'ended' | 'cancelled'
}

interface VideoParticipant {
  id: string
  userId: string
  userType: 'student' | 'consultant' | 'admin'
  joinTime: Date
  leaveTime?: Date
  totalDuration: number
  audioQuality: number
  videoQuality: number
  screenShareDuration: number
  chatMessagesCount: number
  connectionInterruptions: number
  isActive: boolean
}

interface VideoSession {
  id: string
  roomId: string
  sessionId: string
  localStream?: MediaStream
  peerConnection?: RTCPeerConnection
  participants: Map<string, VideoParticipant>
  recordingSession?: RecordingSession
  startTime: Date
  qualitySettings: VideoQualitySettings
  connectionStatus: ConnectionStatus
}

interface VideoQualitySettings {
  video: VideoQuality
  audio: AudioQuality
  bandwidth: 'low' | 'medium' | 'high' | 'adaptive'
  frameRate: number
  bitrate: number
}

interface RecordingSession {
  id: string
  mediaRecorder?: MediaRecorder
  startTime: Date
  endTime?: Date
  status: RecordingStatus
  fileSize?: number
  duration?: number
  recordingUrl?: string
  chunks: Blob[]
}

interface VideoAnalytics {
  sessionId: string
  overallQualityScore: number
  videoQuality: VideoQualityMetrics
  engagement: EngagementMetrics
  technicalIssues: TechnicalIssue[]
  recommendations: string[]
  timestamp: Date
}

interface VideoQualityMetrics {
  averageResolution: VideoQuality
  connectionStability: number
  bufferingEvents: number
  frameDrops: number
  packetLoss: number
  latency: number
}

interface EngagementMetrics {
  actualDuration: number
  scheduledDuration: number
  participantActivity: ParticipantActivity[]
  screenShareUsage: number
  chatActivity: number
}

interface ParticipantActivity {
  totalDuration: number
  screenShareUsage: number
  chatActivity: number
  connectionQuality: number
}

interface TechnicalIssue {
  type: 'buffering' | 'frame_drop' | 'audio_issue' | 'connection_lost' | 'recording_failed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  description: string
  resolved: boolean
}

export class VideoService {
  private static peerConnections: Map<string, RTCPeerConnection> = new Map()
  private static mediaStreams: Map<string, MediaStream> = new Map()
  private static recordingSessions: Map<string, RecordingSession> = new Map()
  private static analyticsData: Map<string, VideoAnalytics> = new Map()

  // WebRTC Configuration
  private static readonly rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ],
    iceCandidatePoolSize: 10
  }

  // Video Quality Presets
  private static readonly qualityPresets: Record<VideoQuality, VideoQualitySettings> = {
    '480p': {
      video: '480p',
      audio: 'medium',
      bandwidth: 'low',
      frameRate: 24,
      bitrate: 500000
    },
    '720p': {
      video: '720p',
      audio: 'high',
      bandwidth: 'medium',
      frameRate: 30,
      bitrate: 1500000
    },
    '1080p': {
      video: '1080p',
      audio: 'high',
      bandwidth: 'high',
      frameRate: 30,
      bitrate: 3000000
    }
  }

  // Room Management
  static async createVideoRoom(sessionId: string, options: {
    recordingEnabled?: boolean
    maxParticipants?: number
    quality?: VideoQuality
  } = {}): Promise<VideoRoom> {
    try {
      const {
        recordingEnabled = true,
        maxParticipants = 2,
        quality = '720p'
      } = options

      // Generate unique room ID
      const roomId = `room_${sessionId}_${Date.now()}`
      
      // Create room record in database
      const videoRoom = await db.videoSession.create({
        data: {
          consultationSessionId: sessionId,
          roomId,
          recordingEnabled,
          videoQuality: quality,
          sessionMetadata: {
            maxParticipants,
            qualitySettings: this.qualityPresets[quality],
            createdAt: new Date()
          }
        }
      })

      const room: VideoRoom = {
        id: videoRoom.id,
        sessionId,
        roomId,
        joinUrl: `/video/session/${sessionId}`,
        guestUrl: `/video/join/${roomId}`,
        recordingEnabled,
        startTime: new Date(),
        maxParticipants,
        currentParticipants: 0,
        status: 'active'
      }

      return room
    } catch (error) {
      console.error('Error creating video room:', error)
      throw new Error('Failed to create video room')
    }
  }

  static async joinVideoRoom(roomId: string, userId: string, userType: 'student' | 'consultant' | 'admin'): Promise<VideoSession> {
    try {
      // Get room information
      const videoRoom = await db.videoSession.findFirst({
        where: { roomId }
      })

      if (!videoRoom) {
        throw new Error('Video room not found')
      }

      // Initialize WebRTC connection
      const peerConnection = new RTCPeerConnection(this.rtcConfiguration)
      
      // Get user media
      const localStream = await navigator.mediaDevices.getUserMedia({
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

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })

      // Set up event handlers
      peerConnection.onicecandidate = (event) => {
        this.handleIceCandidate(roomId, event)
      }

      peerConnection.ontrack = (event) => {
        this.handleRemoteTrack(roomId, event)
      }

      peerConnection.onconnectionstatechange = () => {
        this.handleConnectionStateChange(roomId, peerConnection.connectionState)
      }

      // Store connection
      this.peerConnections.set(roomId, peerConnection)
      this.mediaStreams.set(roomId, localStream)

      // Create participant record
      const participant = await db.videoParticipant.create({
        data: {
          videoSessionId: videoRoom.id,
          userId,
          userType,
          joinTime: new Date(),
          isActive: true
        }
      })

      // Create video session object
      const videoSession: VideoSession = {
        id: videoRoom.id,
        roomId,
        sessionId: videoRoom.consultationSessionId,
        localStream,
        peerConnection,
        participants: new Map(),
        startTime: new Date(),
        qualitySettings: this.qualityPresets['720p'],
        connectionStatus: 'connecting'
      }

      // Add participant to session
      videoSession.participants.set(userId, {
        id: participant.id,
        userId,
        userType,
        joinTime: new Date(),
        totalDuration: 0,
        audioQuality: 0,
        videoQuality: 0,
        screenShareDuration: 0,
        chatMessagesCount: 0,
        connectionInterruptions: 0,
        isActive: true
      })

      // Start recording if enabled
      if (videoRoom.recordingEnabled) {
        await this.startRecording(roomId)
      }

      // Start analytics tracking
      this.startAnalyticsTracking(roomId)

      return videoSession
    } catch (error) {
      console.error('Error joining video room:', error)
      throw new Error('Failed to join video room')
    }
  }

  static async leaveVideoRoom(roomId: string, userId: string): Promise<void> {
    try {
      // Update participant record
      await db.videoParticipant.updateMany({
        where: {
          videoSessionId: { in: Array.from(this.peerConnections.keys()) },
          userId
        },
        data: {
          leaveTime: new Date(),
          isActive: false
        }
      })

      // Stop local stream
      const localStream = this.mediaStreams.get(roomId)
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        this.mediaStreams.delete(roomId)
      }

      // Close peer connection
      const peerConnection = this.peerConnections.get(roomId)
      if (peerConnection) {
        peerConnection.close()
        this.peerConnections.delete(roomId)
      }

      // Stop recording
      await this.stopRecording(roomId)

      // Finalize analytics
      await this.finalizeAnalytics(roomId)
    } catch (error) {
      console.error('Error leaving video room:', error)
      throw new Error('Failed to leave video room')
    }
  }

  // Recording Management
  static async startRecording(roomId: string): Promise<RecordingSession> {
    try {
      const localStream = this.mediaStreams.get(roomId)
      if (!localStream) {
        throw new Error('No local stream available for recording')
      }

      const mediaRecorder = new MediaRecorder(localStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      const recordingSession: RecordingSession = {
        id: `rec_${roomId}_${Date.now()}`,
        mediaRecorder,
        startTime: new Date(),
        status: 'recording',
        chunks: []
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingSession.chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        await this.processRecording(recordingSession)
      }

      mediaRecorder.start(1000) // Collect data every second
      this.recordingSessions.set(roomId, recordingSession)

      return recordingSession
    } catch (error) {
      console.error('Error starting recording:', error)
      throw new Error('Failed to start recording')
    }
  }

  static async stopRecording(roomId: string): Promise<void> {
    try {
      const recordingSession = this.recordingSessions.get(roomId)
      if (recordingSession && recordingSession.mediaRecorder) {
        recordingSession.mediaRecorder.stop()
        recordingSession.status = 'stopped'
        recordingSession.endTime = new Date()
      }
    } catch (error) {
      console.error('Error stopping recording:', error)
      throw new Error('Failed to stop recording')
    }
  }

  private static async processRecording(recordingSession: RecordingSession): Promise<void> {
    try {
      const recordedBlob = new Blob(recordingSession.chunks, { type: 'video/webm' })
      recordingSession.fileSize = recordedBlob.size
      recordingSession.duration = recordingSession.endTime 
        ? (recordingSession.endTime.getTime() - recordingSession.startTime.getTime()) / 1000
        : 0

      // In production, upload to cloud storage
      // For now, we'll store the recording URL
      recordingSession.recordingUrl = `/recordings/${recordingSession.id}.webm`
      recordingSession.status = 'processing'

      // Update database with recording information
      await db.videoSession.updateMany({
        where: { roomId: recordingSession.id.split('_')[1] },
        data: {
          recordingUrl: recordingSession.recordingUrl,
          recordingDurationSeconds: recordingSession.duration
        }
      })
    } catch (error) {
      console.error('Error processing recording:', error)
      recordingSession.status = 'stopped'
    }
  }

  // Analytics and Quality Monitoring
  private static startAnalyticsTracking(roomId: string): void {
    // Set up periodic quality monitoring
    const qualityInterval = setInterval(async () => {
      try {
        const peerConnection = this.peerConnections.get(roomId)
        if (peerConnection) {
          const stats = await peerConnection.getStats()
          this.updateQualityMetrics(roomId, stats)
        }
      } catch (error) {
        console.error('Error updating quality metrics:', error)
      }
    }, 5000) // Update every 5 seconds

    // Store interval reference for cleanup
    this.analyticsData.set(roomId, {
      sessionId: roomId,
      overallQualityScore: 0,
      videoQuality: {
        averageResolution: '720p',
        connectionStability: 0,
        bufferingEvents: 0,
        frameDrops: 0,
        packetLoss: 0,
        latency: 0
      },
      engagement: {
        actualDuration: 0,
        scheduledDuration: 0,
        participantActivity: [],
        screenShareUsage: 0,
        chatActivity: 0
      },
      technicalIssues: [],
      recommendations: [],
      timestamp: new Date()
    })
  }

  private static updateQualityMetrics(roomId: string, stats: RTCStatsReport): void {
    const analytics = this.analyticsData.get(roomId)
    if (!analytics) return

    let totalPacketLoss = 0
    let totalLatency = 0
    let connectionCount = 0

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
        if (report.packetsLost !== undefined) {
          totalPacketLoss += report.packetsLost
        }
        if (report.jitter !== undefined) {
          totalLatency += report.jitter * 1000 // Convert to milliseconds
          connectionCount++
        }
      }
    })

    analytics.videoQuality.packetLoss = totalPacketLoss
    analytics.videoQuality.latency = connectionCount > 0 ? totalLatency / connectionCount : 0

    // Calculate overall quality score
    analytics.overallQualityScore = this.calculateQualityScore(analytics)
  }

  private static calculateQualityScore(analytics: VideoAnalytics): number {
    let score = 100

    // Deduct points for technical issues
    score -= analytics.videoQuality.packetLoss * 2
    score -= analytics.videoQuality.latency / 10
    score -= analytics.videoQuality.bufferingEvents * 5
    score -= analytics.videoQuality.frameDrops * 3

    return Math.max(0, Math.min(100, score))
  }

  private static async finalizeAnalytics(roomId: string): Promise<void> {
    try {
      const analytics = this.analyticsData.get(roomId)
      if (!analytics) return

      // Calculate final engagement metrics
      analytics.engagement.actualDuration = 
        (new Date().getTime() - analytics.timestamp.getTime()) / 1000

      // Generate recommendations
      analytics.recommendations = this.generateRecommendations(analytics)

      // Save analytics to database
      await db.systemHealthMetrics.create({
        data: {
          metricType: 'video_session_analytics',
          metricValue: analytics.overallQualityScore,
          metricUnit: 'score',
          additionalData: analytics
        }
      })

      this.analyticsData.delete(roomId)
    } catch (error) {
      console.error('Error finalizing analytics:', error)
    }
  }

  private static generateRecommendations(analytics: VideoAnalytics): string[] {
    const recommendations: string[] = []

    if (analytics.videoQuality.packetLoss > 10) {
      recommendations.push('Consider improving network connection to reduce packet loss')
    }

    if (analytics.videoQuality.latency > 100) {
      recommendations.push('High latency detected - check network quality')
    }

    if (analytics.videoQuality.bufferingEvents > 5) {
      recommendations.push('Multiple buffering events - consider reducing video quality')
    }

    if (analytics.overallQualityScore < 70) {
      recommendations.push('Overall session quality is below optimal - review technical setup')
    }

    return recommendations
  }

  // WebRTC Event Handlers
  private static handleIceCandidate(roomId: string, event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      // In a real implementation, send the candidate to the remote peer
      console.log('ICE candidate generated:', event.candidate)
    }
  }

  private static handleRemoteTrack(roomId: string, event: RTCTrackEvent): void {
    // Handle incoming remote tracks
    console.log('Remote track received:', event.track.kind)
  }

  private static handleConnectionStateChange(roomId: string, state: RTCPeerConnectionState): void {
    console.log(`Connection state changed for room ${roomId}:`, state)
    
    // Update analytics
    const analytics = this.analyticsData.get(roomId)
    if (analytics) {
      if (state === 'failed' || state === 'disconnected') {
        analytics.technicalIssues.push({
          type: 'connection_lost',
          severity: 'high',
          timestamp: new Date(),
          description: `Connection ${state}`,
          resolved: false
        })
      }
    }
  }

  // Utility Methods
  static async getVideoSession(sessionId: string): Promise<VideoRoom | null> {
    try {
      const videoSession = await db.videoSession.findFirst({
        where: { consultationSessionId: sessionId },
        include: {
          videoParticipants: true
        }
      })

      if (!videoSession) return null

      return {
        id: videoSession.id,
        sessionId: videoSession.consultationSessionId,
        roomId: videoSession.roomId,
        joinUrl: `/video/session/${sessionId}`,
        guestUrl: `/video/join/${videoSession.roomId}`,
        recordingEnabled: videoSession.recordingEnabled,
        startTime: videoSession.createdAt,
        endTime: videoSession.recordingDurationSeconds 
          ? new Date(videoSession.createdAt.getTime() + videoSession.recordingDurationSeconds * 1000)
          : undefined,
        maxParticipants: 2,
        currentParticipants: videoSession.videoParticipants.length,
        status: videoSession.recordingDurationSeconds ? 'ended' : 'active'
      }
    } catch (error) {
      console.error('Error fetching video session:', error)
      return null
    }
  }

  static async getSessionAnalytics(sessionId: string): Promise<VideoAnalytics | null> {
    try {
      const metrics = await db.systemHealthMetrics.findFirst({
        where: {
          metricType: 'video_session_analytics',
          additionalData: {
            path: ['sessionId'],
            equals: sessionId
          }
        },
        orderBy: { timestamp: 'desc' }
      })

      return metrics?.additionalData as VideoAnalytics || null
    } catch (error) {
      console.error('Error fetching session analytics:', error)
      return null
    }
  }
} 