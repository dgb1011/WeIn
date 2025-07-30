import { prisma } from '../db'

// Type definitions for the service
type StudentStatus = 'ENROLLED' | 'CONSULTATION_ACCESS_GRANTED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'READY_FOR_CERTIFICATION' | 'CERTIFIED' | 'SUSPENDED' | 'WITHDRAWN'
type SessionStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED' | 'TECHNICAL_ISSUE'

interface SessionWithConsultant {
  id: string
  status: SessionStatus
  scheduledStart: Date
  scheduledEnd: Date
  actualStart: Date | null
  actualEnd: Date | null
  consultantVerifiedAt: Date | null
  consultant: {
    id: string
    user: {
      firstName: string
      lastName: string
    }
  }
}

export interface StudentProgress {
  verifiedHours: number
  pendingHours: number
  projectedHours: number
  completionPercentage: number
  remainingHours: number
  estimatedCompletionDate: Date | null
  weeklyProgress: WeeklyProgress[]
  milestoneStatus: MilestoneStatus
  consultantDistribution: ConsultantDistribution[]
}

interface WeeklyProgress {
  week: string
  hours: number
  sessions: number
}

interface MilestoneStatus {
  currentMilestone: string
  nextMilestone: string
  progressToNext: number
}

interface ConsultantDistribution {
  consultantId: string
  consultantName: string
  hours: number
  sessions: number
}

export class StudentService {
  static async getStudentProgress(studentId: string): Promise<StudentProgress> {
    const sessions = await prisma.consultationSession.findMany({
      where: { studentId },
      include: {
        consultant: {
          include: { user: true }
        }
      }
    }) as SessionWithConsultant[]

    const verifiedSessions = sessions.filter((s: SessionWithConsultant) => s.status === 'COMPLETED' && s.consultantVerifiedAt)
    const pendingSessions = sessions.filter((s: SessionWithConsultant) => s.status === 'COMPLETED' && !s.consultantVerifiedAt)
    const upcomingSessions = sessions.filter((s: SessionWithConsultant) => s.status === 'SCHEDULED' || s.status === 'CONFIRMED')

    // Calculate verified hours
    const verifiedHours = verifiedSessions.reduce((total: number, session: SessionWithConsultant) => {
      const duration = this.calculateSessionDuration(session)
      return total + duration
    }, 0)

    // Calculate pending hours
    const pendingHours = pendingSessions.reduce((total: number, session: SessionWithConsultant) => {
      const duration = this.calculateSessionDuration(session)
      return total + duration
    }, 0)

    // Calculate projected hours
    const projectedHours = upcomingSessions.reduce((total: number, session: SessionWithConsultant) => {
      const duration = this.calculateSessionDuration(session)
      return total + duration
    }, 0)

    // Calculate completion percentage
    const completionPercentage = Math.min((verifiedHours / 40) * 100, 100)
    const remainingHours = Math.max(40 - verifiedHours, 0)

    // Estimate completion date
    const estimatedCompletionDate = this.estimateCompletionDate(verifiedHours, projectedHours, sessions)

    // Calculate weekly progress
    const weeklyProgress = this.calculateWeeklyProgress(sessions)

    // Get milestone status
    const milestoneStatus = this.getMilestoneStatus(verifiedHours)

    // Analyze consultant distribution
    const consultantDistribution = this.analyzeConsultantDistribution(sessions)

    return {
      verifiedHours,
      pendingHours,
      projectedHours,
      completionPercentage,
      remainingHours,
      estimatedCompletionDate,
      weeklyProgress,
      milestoneStatus,
      consultantDistribution
    }
  }

  static async updateStudentStatus(studentId: string, status: StudentStatus): Promise<void> {
    await prisma.student.update({
      where: { id: studentId },
      data: { certificationStatus: status }
    })
  }

  static async getStudentSessions(studentId: string, options: {
    status?: SessionStatus[]
    limit?: number
    offset?: number
  } = {}) {
    const { status, limit = 20, offset = 0 } = options

    const where: any = { studentId }
    if (status && status.length > 0) {
      where.status = { in: status }
    }

    const sessions = await prisma.consultationSession.findMany({
      where,
      include: {
        consultant: {
          include: { user: true }
        },
        videoSession: true
      },
      orderBy: { scheduledStart: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.consultationSession.count({ where })

    return {
      sessions,
      total,
      hasMore: offset + limit < total
    }
  }

  private static calculateSessionDuration(session: SessionWithConsultant): number {
    if (session.actualStart && session.actualEnd) {
      const duration = new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()
      return duration / (1000 * 60 * 60) // Convert to hours
    }
    
    // Fallback to scheduled duration
    const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
    return duration / (1000 * 60 * 60) // Convert to hours
  }

  private static estimateCompletionDate(verifiedHours: number, projectedHours: number, sessions: SessionWithConsultant[]): Date | null {
    if (verifiedHours >= 40) return null

    const remainingHours = 40 - verifiedHours
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED' && s.consultantVerifiedAt)
    
    if (completedSessions.length === 0) return null

    // Calculate average hours per week
    const firstSession = new Date(Math.min(...completedSessions.map(s => new Date(s.scheduledStart).getTime())))
    const lastSession = new Date(Math.max(...completedSessions.map(s => new Date(s.scheduledStart).getTime())))
    const weeksElapsed = (lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24 * 7)
    const hoursPerWeek = verifiedHours / Math.max(weeksElapsed, 1)

    if (hoursPerWeek <= 0) return null

    const weeksToComplete = remainingHours / hoursPerWeek
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + (weeksToComplete * 7))

    return estimatedDate
  }

  private static calculateWeeklyProgress(sessions: SessionWithConsultant[]): WeeklyProgress[] {
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED' && s.consultantVerifiedAt)
    const weeklyData: { [key: string]: { hours: number; sessions: number } } = {}

    completedSessions.forEach(session => {
      const weekStart = this.getWeekStart(new Date(session.scheduledStart))
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { hours: 0, sessions: 0 }
      }

      weeklyData[weekKey].hours += this.calculateSessionDuration(session)
      weeklyData[weekKey].sessions += 1
    })

    return Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        hours: data.hours,
        sessions: data.sessions
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  private static getMilestoneStatus(verifiedHours: number): MilestoneStatus {
    const milestones = [
      { name: 'Getting Started', hours: 0 },
      { name: 'First 10 Hours', hours: 10 },
      { name: 'Quarter Complete', hours: 25 },
      { name: 'Halfway There', hours: 20 },
      { name: 'Almost There', hours: 30 },
      { name: 'Final Stretch', hours: 35 },
      { name: 'Certification Ready', hours: 40 }
    ]

    let currentMilestone = milestones[0]
    let nextMilestone = milestones[1]

    for (let i = 0; i < milestones.length - 1; i++) {
      if (verifiedHours >= milestones[i].hours && verifiedHours < milestones[i + 1].hours) {
        currentMilestone = milestones[i]
        nextMilestone = milestones[i + 1]
        break
      }
    }

    const progressToNext = nextMilestone.hours > currentMilestone.hours 
      ? ((verifiedHours - currentMilestone.hours) / (nextMilestone.hours - currentMilestone.hours)) * 100
      : 100

    return {
      currentMilestone: currentMilestone.name,
      nextMilestone: nextMilestone.name,
      progressToNext: Math.min(progressToNext, 100)
    }
  }

  private static analyzeConsultantDistribution(sessions: SessionWithConsultant[]): ConsultantDistribution[] {
    const distribution: { [key: string]: ConsultantDistribution } = {}

    sessions.forEach(session => {
      if (session.status === 'COMPLETED' && session.consultantVerifiedAt) {
        const consultantId = session.consultant.id
        const consultantName = `${session.consultant.user.firstName} ${session.consultant.user.lastName}`
        
        if (!distribution[consultantId]) {
          distribution[consultantId] = {
            consultantId,
            consultantName,
            hours: 0,
            sessions: 0
          }
        }

        distribution[consultantId].hours += this.calculateSessionDuration(session)
        distribution[consultantId].sessions += 1
      }
    })

    return Object.values(distribution).sort((a, b) => b.hours - a.hours)
  }
} 