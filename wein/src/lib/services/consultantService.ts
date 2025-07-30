import { db } from '../db'

// Type definitions for the service
type ConsultantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL'
type AvailabilityType = 'RECURRING_WEEKLY' | 'ONE_TIME' | 'BLOCKED_TIME' | 'HOLIDAY_BLOCK'
type SessionStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED' | 'TECHNICAL_ISSUE'

interface ConsultantProfile {
  id: string
  userId: string
  status: ConsultantStatus
  specialties: string[]
  experience: number
  hourlyRate: number
  bio: string
  credentials: string[]
  timezone: string
  maxSessionsPerDay: number
  bufferMinutes: number
  autoApprove: boolean
  createdAt: Date
  updatedAt: Date
}

interface AvailabilitySlot {
  id: string
  consultantId: string
  availabilityType: AvailabilityType
  dayOfWeek?: number
  specificDate?: Date
  startTime: string
  endTime: string
  maxSessions: number
  bufferMinutes: number
  isAvailable: boolean
  bookingWindowDays: number
  minimumNoticeHours: number
  timezone: string
  recurringPattern?: any
}

interface SessionWithStudent {
  id: string
  status: SessionStatus
  scheduledStart: Date
  scheduledEnd: Date
  actualStart: Date | null
  actualEnd: Date | null
  studentVerifiedAt: Date | null
  consultantVerifiedAt: Date | null
  student: {
    id: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

interface PaymentSummary {
  totalEarnings: number
  totalSessions: number
  totalHours: number
  averageHourlyRate: number
  monthlyBreakdown: MonthlyPayment[]
  pendingPayments: number
  lastPaymentDate: Date | null
}

interface MonthlyPayment {
  month: string
  earnings: number
  sessions: number
  hours: number
}

export class ConsultantService {
  // Profile Management
  static async getConsultantProfile(consultantId: string): Promise<ConsultantProfile | null> {
    try {
      const consultant = await db.consultant.findUnique({
        where: { id: consultantId },
        include: {
          user: true
        }
      })

      if (!consultant) return null

      return {
        id: consultant.id,
        userId: consultant.userId,
        status: consultant.status as ConsultantStatus,
        specialties: consultant.specialties || [],
        experience: consultant.experience || 0,
        hourlyRate: consultant.hourlyRate || 0,
        bio: consultant.bio || '',
        credentials: consultant.credentials || [],
        timezone: consultant.timezone || 'UTC',
        maxSessionsPerDay: consultant.maxSessionsPerDay || 8,
        bufferMinutes: consultant.bufferMinutes || 15,
        autoApprove: consultant.autoApprove || false,
        createdAt: consultant.createdAt,
        updatedAt: consultant.updatedAt
      }
    } catch (error) {
      console.error('Error fetching consultant profile:', error)
      throw new Error('Failed to fetch consultant profile')
    }
  }

  static async updateConsultantProfile(consultantId: string, updates: Partial<ConsultantProfile>): Promise<ConsultantProfile> {
    try {
      const updatedConsultant = await db.consultant.update({
        where: { id: consultantId },
        data: {
          status: updates.status,
          specialties: updates.specialties,
          experience: updates.experience,
          hourlyRate: updates.hourlyRate,
          bio: updates.bio,
          credentials: updates.credentials,
          timezone: updates.timezone,
          maxSessionsPerDay: updates.maxSessionsPerDay,
          bufferMinutes: updates.bufferMinutes,
          autoApprove: updates.autoApprove,
          updatedAt: new Date()
        }
      })

      return await this.getConsultantProfile(consultantId) as ConsultantProfile
    } catch (error) {
      console.error('Error updating consultant profile:', error)
      throw new Error('Failed to update consultant profile')
    }
  }

  // Availability Management
  static async getConsultantAvailability(consultantId: string, dateRange?: { start: Date; end: Date }): Promise<AvailabilitySlot[]> {
    try {
      const where: any = { consultantId }
      
      if (dateRange) {
        where.OR = [
          { specificDate: { gte: dateRange.start, lte: dateRange.end } },
          { availabilityType: 'RECURRING_WEEKLY' }
        ]
      }

      const availability = await db.consultantAvailability.findMany({
        where,
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      })

      return availability.map(slot => ({
        id: slot.id,
        consultantId: slot.consultantId,
        availabilityType: slot.availabilityType as AvailabilityType,
        dayOfWeek: slot.dayOfWeek || undefined,
        specificDate: slot.specificDate || undefined,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxSessions: slot.maxSessions,
        bufferMinutes: slot.bufferMinutes,
        isAvailable: slot.isAvailable,
        bookingWindowDays: slot.bookingWindowDays,
        minimumNoticeHours: slot.minimumNoticeHours,
        timezone: slot.timezone,
        recurringPattern: slot.recurringPattern
      }))
    } catch (error) {
      console.error('Error fetching consultant availability:', error)
      throw new Error('Failed to fetch consultant availability')
    }
  }

  static async addAvailabilitySlot(consultantId: string, slot: Omit<AvailabilitySlot, 'id' | 'consultantId'>): Promise<AvailabilitySlot> {
    try {
      const newSlot = await db.consultantAvailability.create({
        data: {
          consultantId,
          availabilityType: slot.availabilityType,
          dayOfWeek: slot.dayOfWeek,
          specificDate: slot.specificDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxSessions: slot.maxSessions,
          bufferMinutes: slot.bufferMinutes,
          isAvailable: slot.isAvailable,
          bookingWindowDays: slot.bookingWindowDays,
          minimumNoticeHours: slot.minimumNoticeHours,
          timezone: slot.timezone,
          recurringPattern: slot.recurringPattern
        }
      })

      return {
        id: newSlot.id,
        consultantId: newSlot.consultantId,
        availabilityType: newSlot.availabilityType as AvailabilityType,
        dayOfWeek: newSlot.dayOfWeek || undefined,
        specificDate: newSlot.specificDate || undefined,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        maxSessions: newSlot.maxSessions,
        bufferMinutes: newSlot.bufferMinutes,
        isAvailable: newSlot.isAvailable,
        bookingWindowDays: newSlot.bookingWindowDays,
        minimumNoticeHours: newSlot.minimumNoticeHours,
        timezone: newSlot.timezone,
        recurringPattern: newSlot.recurringPattern
      }
    } catch (error) {
      console.error('Error adding availability slot:', error)
      throw new Error('Failed to add availability slot')
    }
  }

  static async updateAvailabilitySlot(slotId: string, updates: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> {
    try {
      const updatedSlot = await db.consultantAvailability.update({
        where: { id: slotId },
        data: {
          availabilityType: updates.availabilityType,
          dayOfWeek: updates.dayOfWeek,
          specificDate: updates.specificDate,
          startTime: updates.startTime,
          endTime: updates.endTime,
          maxSessions: updates.maxSessions,
          bufferMinutes: updates.bufferMinutes,
          isAvailable: updates.isAvailable,
          bookingWindowDays: updates.bookingWindowDays,
          minimumNoticeHours: updates.minimumNoticeHours,
          timezone: updates.timezone,
          recurringPattern: updates.recurringPattern
        }
      })

      return {
        id: updatedSlot.id,
        consultantId: updatedSlot.consultantId,
        availabilityType: updatedSlot.availabilityType as AvailabilityType,
        dayOfWeek: updatedSlot.dayOfWeek || undefined,
        specificDate: updatedSlot.specificDate || undefined,
        startTime: updatedSlot.startTime,
        endTime: updatedSlot.endTime,
        maxSessions: updatedSlot.maxSessions,
        bufferMinutes: updatedSlot.bufferMinutes,
        isAvailable: updatedSlot.isAvailable,
        bookingWindowDays: updatedSlot.bookingWindowDays,
        minimumNoticeHours: updatedSlot.minimumNoticeHours,
        timezone: updatedSlot.timezone,
        recurringPattern: updatedSlot.recurringPattern
      }
    } catch (error) {
      console.error('Error updating availability slot:', error)
      throw new Error('Failed to update availability slot')
    }
  }

  static async deleteAvailabilitySlot(slotId: string): Promise<void> {
    try {
      await db.consultantAvailability.delete({
        where: { id: slotId }
      })
    } catch (error) {
      console.error('Error deleting availability slot:', error)
      throw new Error('Failed to delete availability slot')
    }
  }

  // Session Verification
  static async getPendingVerifications(consultantId: string): Promise<SessionWithStudent[]> {
    try {
      const sessions = await db.consultationSession.findMany({
        where: {
          consultantId,
          status: 'COMPLETED',
          consultantVerifiedAt: null
        },
        include: {
          student: {
            include: { user: true }
          }
        },
        orderBy: { scheduledStart: 'desc' }
      })

      return sessions.map(session => ({
        id: session.id,
        status: session.status as SessionStatus,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        actualStart: session.actualStart,
        actualEnd: session.actualEnd,
        studentVerifiedAt: session.studentVerifiedAt,
        consultantVerifiedAt: session.consultantVerifiedAt,
        student: {
          id: session.student.id,
          user: {
            firstName: session.student.user.firstName,
            lastName: session.student.user.lastName,
            email: session.student.user.email
          }
        }
      }))
    } catch (error) {
      console.error('Error fetching pending verifications:', error)
      throw new Error('Failed to fetch pending verifications')
    }
  }

  static async verifySession(sessionId: string, consultantId: string, notes?: string): Promise<void> {
    try {
      await db.consultationSession.update({
        where: {
          id: sessionId,
          consultantId // Ensure consultant can only verify their own sessions
        },
        data: {
          consultantVerifiedAt: new Date(),
          consultantNotes: notes
        }
      })
    } catch (error) {
      console.error('Error verifying session:', error)
      throw new Error('Failed to verify session')
    }
  }

  static async bulkVerifySessions(sessionIds: string[], consultantId: string): Promise<void> {
    try {
      await db.consultationSession.updateMany({
        where: {
          id: { in: sessionIds },
          consultantId
        },
        data: {
          consultantVerifiedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error bulk verifying sessions:', error)
      throw new Error('Failed to bulk verify sessions')
    }
  }

  // Payment Tracking
  static async getPaymentSummary(consultantId: string, dateRange?: { start: Date; end: Date }): Promise<PaymentSummary> {
    try {
      const where: any = {
        consultantId,
        status: 'COMPLETED',
        consultantVerifiedAt: { not: null }
      }

      if (dateRange) {
        where.scheduledStart = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const sessions = await db.consultationSession.findMany({
        where,
        include: {
          consultant: true
        },
        orderBy: { scheduledStart: 'desc' }
      })

      const totalSessions = sessions.length
      const totalHours = sessions.reduce((total, session) => {
        const duration = this.calculateSessionDuration(session)
        return total + duration
      }, 0)

      const totalEarnings = sessions.reduce((total, session) => {
        const duration = this.calculateSessionDuration(session)
        const hourlyRate = session.consultant.hourlyRate || 0
        return total + (duration * hourlyRate)
      }, 0)

      const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0

      // Calculate monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyBreakdown(sessions)

      // Get pending payments (sessions verified but not yet paid)
      const pendingSessions = await db.consultationSession.count({
        where: {
          consultantId,
          status: 'COMPLETED',
          consultantVerifiedAt: { not: null },
          paymentProcessed: false
        }
      })

      const pendingPayments = pendingSessions * (sessions[0]?.consultant.hourlyRate || 0)

      // Get last payment date
      const lastPayment = await db.consultantPayment.findFirst({
        where: { consultantId },
        orderBy: { paymentDate: 'desc' }
      })

      return {
        totalEarnings,
        totalSessions,
        totalHours,
        averageHourlyRate,
        monthlyBreakdown,
        pendingPayments,
        lastPaymentDate: lastPayment?.paymentDate || null
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error)
      throw new Error('Failed to fetch payment summary')
    }
  }

  static async getSessionHistory(consultantId: string, options: {
    status?: SessionStatus[]
    limit?: number
    offset?: number
    dateRange?: { start: Date; end: Date }
  } = {}): Promise<{ sessions: SessionWithStudent[]; total: number; hasMore: boolean }> {
    try {
      const { status, limit = 20, offset = 0, dateRange } = options

      const where: any = { consultantId }
      
      if (status && status.length > 0) {
        where.status = { in: status }
      }

      if (dateRange) {
        where.scheduledStart = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const sessions = await db.consultationSession.findMany({
        where,
        include: {
          student: {
            include: { user: true }
          }
        },
        orderBy: { scheduledStart: 'desc' },
        take: limit,
        skip: offset
      })

      const total = await db.consultationSession.count({ where })

      return {
        sessions: sessions.map(session => ({
          id: session.id,
          status: session.status as SessionStatus,
          scheduledStart: session.scheduledStart,
          scheduledEnd: session.scheduledEnd,
          actualStart: session.actualStart,
          actualEnd: session.actualEnd,
          studentVerifiedAt: session.studentVerifiedAt,
          consultantVerifiedAt: session.consultantVerifiedAt,
          student: {
            id: session.student.id,
            user: {
              firstName: session.student.user.firstName,
              lastName: session.student.user.lastName,
              email: session.student.user.email
            }
          }
        })),
        total,
        hasMore: offset + limit < total
      }
    } catch (error) {
      console.error('Error fetching session history:', error)
      throw new Error('Failed to fetch session history')
    }
  }

  // Helper methods
  private static calculateSessionDuration(session: any): number {
    if (session.actualStart && session.actualEnd) {
      const duration = new Date(session.actualEnd).getTime() - new Date(session.actualStart).getTime()
      return duration / (1000 * 60 * 60) // Convert to hours
    }
    
    // Fallback to scheduled duration
    const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
    return duration / (1000 * 60 * 60) // Convert to hours
  }

  private static calculateMonthlyBreakdown(sessions: any[]): MonthlyPayment[] {
    const monthlyData: { [key: string]: { earnings: number; sessions: number; hours: number } } = {}

    sessions.forEach(session => {
      const monthKey = new Date(session.scheduledStart).toISOString().slice(0, 7) // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { earnings: 0, sessions: 0, hours: 0 }
      }

      const duration = this.calculateSessionDuration(session)
      const hourlyRate = session.consultant.hourlyRate || 0
      const earnings = duration * hourlyRate

      monthlyData[monthKey].earnings += earnings
      monthlyData[monthKey].sessions += 1
      monthlyData[monthKey].hours += duration
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        earnings: data.earnings,
        sessions: data.sessions,
        hours: data.hours
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
  }
} 