import { db } from '../db'

// Type definitions for progress tracking
type MilestoneType = 'FIRST_SESSION' | 'TEN_HOURS' | 'TWENTY_HOURS' | 'THIRTY_HOURS' | 'FORTY_HOURS' | 'CERTIFICATION_READY'
type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MILESTONE_REACHED' | 'COMPLETED'

interface ProgressData {
  studentId: string
  totalVerifiedHours: number
  totalPendingHours: number
  totalProjectedHours: number
  completionPercentage: number
  remainingHours: number
  estimatedCompletionDate: Date | null
  weeklyProgress: WeeklyProgress[]
  milestoneStatus: MilestoneStatus[]
  consultantDistribution: ConsultantDistribution[]
  sessionHistory: SessionSummary[]
  currentStreak: number
  averageSessionLength: number
  lastSessionDate: Date | null
  nextMilestone: MilestoneInfo | null
}

interface WeeklyProgress {
  weekStart: Date
  weekEnd: Date
  hoursCompleted: number
  sessionsCompleted: number
  averageRating: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface MilestoneStatus {
  type: MilestoneType
  status: ProgressStatus
  achievedAt: Date | null
  description: string
  icon: string
  color: string
}

interface MilestoneInfo {
  type: MilestoneType
  description: string
  hoursRequired: number
  hoursRemaining: number
  estimatedDate: Date
  icon: string
  color: string
}

interface ConsultantDistribution {
  consultantId: string
  consultantName: string
  sessionsCount: number
  totalHours: number
  averageRating: number
  lastSessionDate: Date
  percentage: number
}

interface SessionSummary {
  id: string
  date: Date
  duration: number
  consultantName: string
  status: string
  rating?: number
  notes?: string
}

interface ProgressFilters {
  dateRange?: { start: Date; end: Date }
  consultantId?: string
  status?: string[]
  includePending?: boolean
}

export class ProgressService {
  // Main progress calculation
  static async getStudentProgress(studentId: string, filters?: ProgressFilters): Promise<ProgressData> {
    try {
      // Get all sessions for the student
      const sessions = await this.getStudentSessions(studentId, filters)
      
      // Calculate verified hours
      const verifiedSessions = sessions.filter(s => s.status === 'COMPLETED' && s.studentVerifiedAt && s.consultantVerifiedAt)
      const totalVerifiedHours = verifiedSessions.reduce((total, session) => {
        return total + this.calculateSessionDuration(session)
      }, 0)

      // Calculate pending hours
      const pendingSessions = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS')
      const totalPendingHours = pendingSessions.reduce((total, session) => {
        const duration = (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60 * 60)
        return total + duration
      }, 0)

      // Calculate projected hours (based on weekly average)
      const weeklyAverage = this.calculateWeeklyAverage(verifiedSessions)
      const weeksToCompletion = Math.ceil((40 - totalVerifiedHours) / weeklyAverage)
      const totalProjectedHours = totalVerifiedHours + (weeklyAverage * weeksToCompletion)

      // Calculate completion percentage
      const completionPercentage = Math.min((totalVerifiedHours / 40) * 100, 100)
      const remainingHours = Math.max(40 - totalVerifiedHours, 0)

      // Calculate estimated completion date
      const estimatedCompletionDate = this.calculateEstimatedCompletion(
        totalVerifiedHours,
        weeklyAverage,
        verifiedSessions
      )

      // Get weekly progress
      const weeklyProgress = this.calculateWeeklyProgress(verifiedSessions)

      // Get milestone status
      const milestoneStatus = this.calculateMilestoneStatus(totalVerifiedHours, verifiedSessions)

      // Get consultant distribution
      const consultantDistribution = this.calculateConsultantDistribution(verifiedSessions)

      // Get session history
      const sessionHistory = this.formatSessionHistory(sessions)

      // Calculate current streak
      const currentStreak = this.calculateCurrentStreak(verifiedSessions)

      // Calculate average session length
      const averageSessionLength = this.calculateAverageSessionLength(verifiedSessions)

      // Get last session date
      const lastSessionDate = verifiedSessions.length > 0 
        ? new Date(Math.max(...verifiedSessions.map(s => s.actualEnd?.getTime() || 0)))
        : null

      // Get next milestone
      const nextMilestone = this.getNextMilestone(totalVerifiedHours, weeklyAverage)

      return {
        studentId,
        totalVerifiedHours,
        totalPendingHours,
        totalProjectedHours,
        completionPercentage,
        remainingHours,
        estimatedCompletionDate,
        weeklyProgress,
        milestoneStatus,
        consultantDistribution,
        sessionHistory,
        currentStreak,
        averageSessionLength,
        lastSessionDate,
        nextMilestone
      }
    } catch (error) {
      console.error('Error calculating student progress:', error)
      throw new Error('Failed to calculate student progress')
    }
  }

  // Get student sessions with filters
  private static async getStudentSessions(studentId: string, filters?: ProgressFilters) {
    const whereClause: any = { studentId }

    if (filters?.dateRange) {
      whereClause.scheduledStart = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    if (filters?.consultantId) {
      whereClause.consultantId = filters.consultantId
    }

    if (filters?.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status }
    }

    return await db.consultationSession.findMany({
      where: whereClause,
      include: {
        consultant: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        scheduledStart: 'desc'
      }
    })
  }

  // Calculate session duration in hours
  private static calculateSessionDuration(session: any): number {
    if (!session.actualStart || !session.actualEnd) {
      return (session.scheduledDuration || 60) / 60
    }
    
    const durationMs = session.actualEnd.getTime() - session.actualStart.getTime()
    return durationMs / (1000 * 60 * 60) // Convert to hours
  }

  // Calculate weekly average hours
  private static calculateWeeklyAverage(sessions: any[]): number {
    if (sessions.length === 0) return 2 // Default 2 hours per week

    const totalHours = sessions.reduce((total, session) => {
      return total + this.calculateSessionDuration(session)
    }, 0)

    const firstSession = sessions[sessions.length - 1]
    const lastSession = sessions[0]
    const weeksDiff = Math.max(1, (lastSession.actualEnd!.getTime() - firstSession.actualStart!.getTime()) / (1000 * 60 * 60 * 24 * 7))

    return totalHours / weeksDiff
  }

  // Calculate estimated completion date
  private static calculateEstimatedCompletion(
    currentHours: number,
    weeklyAverage: number,
    sessions: any[]
  ): Date | null {
    if (currentHours >= 40) return new Date()

    const remainingHours = 40 - currentHours
    const weeksToCompletion = Math.ceil(remainingHours / weeklyAverage)

    if (sessions.length === 0) {
      // No sessions yet, estimate based on typical student pace
      const estimatedWeeks = Math.ceil(40 / 2) // Assume 2 hours per week
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + (estimatedWeeks * 7))
      return estimatedDate
    }

    const lastSession = sessions[0]
    const estimatedDate = new Date(lastSession.actualEnd || lastSession.scheduledEnd)
    estimatedDate.setDate(estimatedDate.getDate() + (weeksToCompletion * 7))

    return estimatedDate
  }

  // Calculate weekly progress
  private static calculateWeeklyProgress(sessions: any[]): WeeklyProgress[] {
    if (sessions.length === 0) return []

    const weeklyData = new Map<string, WeeklyProgress>()

    sessions.forEach(session => {
      const sessionDate = new Date(session.actualEnd || session.scheduledEnd)
      const weekStart = this.getWeekStart(sessionDate)
      const weekKey = weekStart.toISOString()

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          weekStart,
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
          hoursCompleted: 0,
          sessionsCompleted: 0,
          averageRating: 0,
          trend: 'stable'
        })
      }

      const weekData = weeklyData.get(weekKey)!
      weekData.hoursCompleted += this.calculateSessionDuration(session)
      weekData.sessionsCompleted += 1
      
      if (session.rating) {
        weekData.averageRating = (weekData.averageRating * (weekData.sessionsCompleted - 1) + session.rating) / weekData.sessionsCompleted
      }
    })

    // Calculate trends
    const weeks = Array.from(weeklyData.values()).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    
    for (let i = 1; i < weeks.length; i++) {
      const current = weeks[i]
      const previous = weeks[i - 1]
      
      if (current.hoursCompleted > previous.hoursCompleted) {
        current.trend = 'increasing'
      } else if (current.hoursCompleted < previous.hoursCompleted) {
        current.trend = 'decreasing'
      }
    }

    return weeks.slice(-12) // Return last 12 weeks
  }

  // Calculate milestone status
  private static calculateMilestoneStatus(currentHours: number, sessions: any[]): MilestoneStatus[] {
    const milestones: MilestoneStatus[] = [
      {
        type: 'FIRST_SESSION',
        status: sessions.length > 0 ? 'MILESTONE_REACHED' : 'NOT_STARTED',
        achievedAt: sessions.length > 0 ? sessions[sessions.length - 1].actualEnd : null,
        description: 'Complete your first consultation session',
        icon: '🎯',
        color: 'blue'
      },
      {
        type: 'TEN_HOURS',
        status: currentHours >= 10 ? 'MILESTONE_REACHED' : currentHours > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        achievedAt: currentHours >= 10 ? this.getMilestoneAchievementDate(sessions, 10) : null,
        description: 'Complete 10 hours of consultation',
        icon: '⭐',
        color: 'green'
      },
      {
        type: 'TWENTY_HOURS',
        status: currentHours >= 20 ? 'MILESTONE_REACHED' : currentHours > 10 ? 'IN_PROGRESS' : 'NOT_STARTED',
        achievedAt: currentHours >= 20 ? this.getMilestoneAchievementDate(sessions, 20) : null,
        description: 'Complete 20 hours of consultation',
        icon: '🏆',
        color: 'purple'
      },
      {
        type: 'THIRTY_HOURS',
        status: currentHours >= 30 ? 'MILESTONE_REACHED' : currentHours > 20 ? 'IN_PROGRESS' : 'NOT_STARTED',
        achievedAt: currentHours >= 30 ? this.getMilestoneAchievementDate(sessions, 30) : null,
        description: 'Complete 30 hours of consultation',
        icon: '👑',
        color: 'orange'
      },
      {
        type: 'FORTY_HOURS',
        status: currentHours >= 40 ? 'MILESTONE_REACHED' : currentHours > 30 ? 'IN_PROGRESS' : 'NOT_STARTED',
        achievedAt: currentHours >= 40 ? this.getMilestoneAchievementDate(sessions, 40) : null,
        description: 'Complete 40 hours of consultation',
        icon: '🎉',
        color: 'red'
      },
      {
        type: 'CERTIFICATION_READY',
        status: currentHours >= 40 ? 'MILESTONE_REACHED' : currentHours > 35 ? 'IN_PROGRESS' : 'NOT_STARTED',
        achievedAt: currentHours >= 40 ? this.getMilestoneAchievementDate(sessions, 40) : null,
        description: 'Ready for certification',
        icon: '📜',
        color: 'gold'
      }
    ]

    return milestones
  }

  // Calculate consultant distribution
  private static calculateConsultantDistribution(sessions: any[]): ConsultantDistribution[] {
    const consultantMap = new Map<string, ConsultantDistribution>()

    sessions.forEach(session => {
      const consultantId = session.consultantId
      const consultantName = `${session.consultant.user.firstName} ${session.consultant.user.lastName}`
      
      if (!consultantMap.has(consultantId)) {
        consultantMap.set(consultantId, {
          consultantId,
          consultantName,
          sessionsCount: 0,
          totalHours: 0,
          averageRating: 0,
          lastSessionDate: new Date(0),
          percentage: 0
        })
      }

      const consultant = consultantMap.get(consultantId)!
      consultant.sessionsCount += 1
      consultant.totalHours += this.calculateSessionDuration(session)
      
      if (session.rating) {
        consultant.averageRating = (consultant.averageRating * (consultant.sessionsCount - 1) + session.rating) / consultant.sessionsCount
      }

      const sessionDate = new Date(session.actualEnd || session.scheduledEnd)
      if (sessionDate > consultant.lastSessionDate) {
        consultant.lastSessionDate = sessionDate
      }
    })

    const totalHours = sessions.reduce((total, session) => total + this.calculateSessionDuration(session), 0)
    
    return Array.from(consultantMap.values()).map(consultant => ({
      ...consultant,
      percentage: totalHours > 0 ? (consultant.totalHours / totalHours) * 100 : 0
    })).sort((a, b) => b.totalHours - a.totalHours)
  }

  // Format session history
  private static formatSessionHistory(sessions: any[]): SessionSummary[] {
    return sessions.map(session => ({
      id: session.id,
      date: new Date(session.actualEnd || session.scheduledEnd),
      duration: this.calculateSessionDuration(session),
      consultantName: `${session.consultant.user.firstName} ${session.consultant.user.lastName}`,
      status: session.status,
      rating: session.rating || undefined,
      notes: session.studentNotes || undefined
    }))
  }

  // Calculate current streak
  private static calculateCurrentStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0

    const sortedSessions = sessions.sort((a, b) => 
      new Date(b.actualEnd || b.scheduledEnd).getTime() - new Date(a.actualEnd || a.scheduledEnd).getTime()
    )

    let streak = 0
    const today = new Date()
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.actualEnd || session.scheduledEnd)
      if (sessionDate >= oneWeekAgo) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  // Calculate average session length
  private static calculateAverageSessionLength(sessions: any[]): number {
    if (sessions.length === 0) return 60

    const totalDuration = sessions.reduce((total, session) => {
      return total + this.calculateSessionDuration(session)
    }, 0)

    return (totalDuration / sessions.length) * 60 // Convert back to minutes
  }

  // Get next milestone
  private static getNextMilestone(currentHours: number, weeklyAverage: number): MilestoneInfo | null {
    const milestones = [
      { type: 'FIRST_SESSION' as MilestoneType, hoursRequired: 0, description: 'First Session', icon: '🎯', color: 'blue' },
      { type: 'TEN_HOURS' as MilestoneType, hoursRequired: 10, description: '10 Hours', icon: '⭐', color: 'green' },
      { type: 'TWENTY_HOURS' as MilestoneType, hoursRequired: 20, description: '20 Hours', icon: '🏆', color: 'purple' },
      { type: 'THIRTY_HOURS' as MilestoneType, hoursRequired: 30, description: '30 Hours', icon: '👑', color: 'orange' },
      { type: 'FORTY_HOURS' as MilestoneType, hoursRequired: 40, description: '40 Hours', icon: '🎉', color: 'red' }
    ]

    const nextMilestone = milestones.find(m => m.hoursRequired > currentHours)
    if (!nextMilestone) return null

    const hoursRemaining = nextMilestone.hoursRequired - currentHours
    const weeksToMilestone = Math.ceil(hoursRemaining / weeklyAverage)
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + (weeksToMilestone * 7))

    return {
      ...nextMilestone,
      hoursRemaining,
      estimatedDate
    }
  }

  // Helper methods
  private static getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  private static getMilestoneAchievementDate(sessions: any[], targetHours: number): Date | null {
    let accumulatedHours = 0
    
    for (const session of sessions) {
      accumulatedHours += this.calculateSessionDuration(session)
      if (accumulatedHours >= targetHours) {
        return new Date(session.actualEnd || session.scheduledEnd)
      }
    }
    
    return null
  }

  // Public methods for external use
  static async updateProgress(studentId: string): Promise<ProgressData> {
    return await this.getStudentProgress(studentId)
  }

  static async getProgressAnalytics(studentId: string, dateRange?: { start: Date; end: Date }) {
    const progress = await this.getStudentProgress(studentId, { dateRange })
    
    return {
      totalSessions: progress.sessionHistory.length,
      averageSessionLength: progress.averageSessionLength,
      completionRate: progress.completionPercentage,
      weeklyAverage: progress.weeklyProgress.length > 0 
        ? progress.weeklyProgress.reduce((sum, week) => sum + week.hoursCompleted, 0) / progress.weeklyProgress.length
        : 0,
      consultantCount: progress.consultantDistribution.length,
      currentStreak: progress.currentStreak,
      estimatedCompletion: progress.estimatedCompletionDate
    }
  }

  static async getMilestoneProgress(studentId: string): Promise<MilestoneStatus[]> {
    const progress = await this.getStudentProgress(studentId)
    return progress.milestoneStatus
  }

  static async getWeeklyProgress(studentId: string, weeks: number = 12): Promise<WeeklyProgress[]> {
    const progress = await this.getStudentProgress(studentId)
    return progress.weeklyProgress.slice(-weeks)
  }
} 