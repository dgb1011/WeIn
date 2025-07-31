import { db } from '../db'

// Type definitions for the scheduling service
type AvailabilityType = 'RECURRING_WEEKLY' | 'ONE_TIME' | 'BLOCKED_TIME' | 'HOLIDAY_BLOCK'
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED'
type TimeSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST'

interface TimeSlot {
  id: string
  consultantId: string
  startTime: Date
  endTime: Date
  duration: number // in minutes
  status: TimeSlotStatus
  isRecurring: boolean
  dayOfWeek?: number
  timezone: string
  maxSessions: number
  currentBookings: number
}

interface AvailabilitySlot {
  id: string
  consultantId: string
  availabilityType: AvailabilityType
  dayOfWeek?: number
  specificDate?: Date
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  maxSessions: number
  bufferMinutes: number
  isAvailable: boolean
  bookingWindowDays: number
  minimumNoticeHours: number
  timezone: string
  recurringPattern?: any
}

interface BookingRequest {
  studentId: string
  consultantId: string
  startTime: Date
  endTime: Date
  sessionType: string
  notes?: string
  preferences?: BookingPreferences
}

interface BookingPreferences {
  preferredDuration: number
  preferredTimeSlots: string[]
  avoidTimes: string[]
  maxTravelTime?: number
  preferredConsultants?: string[]
}

interface BookingConfirmation {
  bookingId: string
  consultantId: string
  studentId: string
  startTime: Date
  endTime: Date
  duration: number
  status: BookingStatus
  confirmationCode: string
  joinUrl: string
  consultantInfo: ConsultantInfo
}

interface ConsultantInfo {
  id: string
  name: string
  email: string
  specialties: string[]
  rating: number
  timezone: string
}

interface SchedulingConflict {
  type: 'DOUBLE_BOOKING' | 'UNAVAILABLE_TIME' | 'MINIMUM_NOTICE' | 'MAX_SESSIONS'
  message: string
  conflictingSlot?: TimeSlot
  suggestedAlternatives?: TimeSlot[]
}

export class SchedulingService {
  // Availability Management
  static async getConsultantAvailability(
    consultantId: string, 
    dateRange: { start: Date; end: Date },
    includeBooked: boolean = false
  ): Promise<TimeSlot[]> {
    try {
      const availability = await db.consultantAvailability.findMany({
        where: {
          consultantId,
          isAvailable: true,
          OR: [
            { specificDate: { gte: dateRange.start, lte: dateRange.end } },
            { availabilityType: 'RECURRING_WEEKLY' }
          ]
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      })

      // Generate time slots from availability
      const timeSlots: TimeSlot[] = []
      
      for (const slot of availability) {
        const slots = this.generateTimeSlotsFromAvailability(slot, dateRange)
        timeSlots.push(...slots)
      }

      // Get existing bookings
      if (includeBooked) {
        const bookings = await db.consultationSession.findMany({
          where: {
            consultantId,
            scheduledStart: { gte: dateRange.start, lte: dateRange.end }
          },
          select: {
            id: true,
            scheduledStart: true,
            scheduledEnd: true,
            status: true
          }
        })

        // Mark booked slots
        for (const booking of bookings) {
          const conflictingSlots = timeSlots.filter(slot => 
            this.slotsOverlap(slot, {
              startTime: booking.scheduledStart,
              endTime: booking.scheduledEnd
            })
          )
          
          conflictingSlots.forEach(slot => {
            slot.status = 'BOOKED'
            slot.currentBookings++
          })
        }
      }

      // Filter out past slots
      const now = new Date()
      return timeSlots.filter(slot => slot.startTime > now)
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

  // Booking Management
  static async findAvailableSlots(
    studentId: string,
    preferences: BookingPreferences,
    dateRange: { start: Date; end: Date }
  ): Promise<TimeSlot[]> {
    try {
      // Get all consultants
      const consultants = await db.consultant.findMany({
        where: { isActive: true },
        include: { user: true }
      })

      const allSlots: TimeSlot[] = []

      // Get availability for each consultant
      for (const consultant of consultants) {
        const consultantSlots = await this.getConsultantAvailability(
          consultant.id,
          dateRange,
          true
        )

        // Filter by preferences
        const filteredSlots = this.filterSlotsByPreferences(
          consultantSlots,
          preferences,
          consultant
        )

        allSlots.push(...filteredSlots)
      }

      // Sort by preference score
      const scoredSlots = await this.scoreSlots(allSlots, studentId, preferences)
      
      return scoredSlots.sort((a, b) => (b as any).score - (a as any).score)
    } catch (error) {
      console.error('Error finding available slots:', error)
      throw new Error('Failed to find available slots')
    }
  }

  static async bookSession(bookingRequest: BookingRequest): Promise<BookingConfirmation> {
    try {
      // Validate booking request
      const conflicts = await this.checkBookingConflicts(bookingRequest)
      if (conflicts.length > 0) {
        throw new Error(`Booking conflicts found: ${conflicts.map(c => c.message).join(', ')}`)
      }

      // Create consultation session
      const session = await db.consultationSession.create({
        data: {
          studentId: bookingRequest.studentId,
          consultantId: bookingRequest.consultantId,
          scheduledStart: bookingRequest.startTime,
          scheduledEnd: bookingRequest.endTime,
          status: 'SCHEDULED',
          sessionType: bookingRequest.sessionType,
          studentNotes: bookingRequest.notes
        }
      })

      // Get consultant info
      const consultant = await db.consultant.findUnique({
        where: { id: bookingRequest.consultantId },
        include: { user: true }
      })

      if (!consultant) {
        throw new Error('Consultant not found')
      }

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode()

      // Create booking confirmation
      const confirmation: BookingConfirmation = {
        bookingId: session.id,
        consultantId: session.consultantId,
        studentId: session.studentId,
        startTime: session.scheduledStart,
        endTime: session.scheduledEnd,
        duration: (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60),
        status: 'CONFIRMED',
        confirmationCode,
        joinUrl: `/video/session/${session.id}`,
        consultantInfo: {
          id: consultant.id,
          name: `${consultant.user.firstName} ${consultant.user.lastName}`,
          email: consultant.user.email,
          specialties: consultant.specialties || [],
          rating: 4.5, // Mock rating
          timezone: consultant.timezone || 'UTC'
        }
      }

      // Send notifications (in production, this would trigger email/SMS)
      await this.sendBookingNotifications(confirmation)

      return confirmation
    } catch (error) {
      console.error('Error booking session:', error)
      throw new Error('Failed to book session')
    }
  }

  static async rescheduleSession(
    sessionId: string,
    newStartTime: Date,
    newEndTime: Date,
    reason?: string
  ): Promise<BookingConfirmation> {
    try {
      // Get existing session
      const existingSession = await db.consultationSession.findUnique({
        where: { id: sessionId },
        include: {
          consultant: { include: { user: true } },
          student: { include: { user: true } }
        }
      })

      if (!existingSession) {
        throw new Error('Session not found')
      }

      // Check conflicts for new time
      const conflicts = await this.checkBookingConflicts({
        studentId: existingSession.studentId,
        consultantId: existingSession.consultantId,
        startTime: newStartTime,
        endTime: newEndTime,
        sessionType: existingSession.sessionType
      })

      if (conflicts.length > 0) {
        throw new Error(`Rescheduling conflicts found: ${conflicts.map(c => c.message).join(', ')}`)
      }

      // Update session
      const updatedSession = await db.consultationSession.update({
        where: { id: sessionId },
        data: {
          scheduledStart: newStartTime,
          scheduledEnd: newEndTime,
          status: 'RESCHEDULED',
          studentNotes: reason ? `${existingSession.studentNotes || ''}\nRescheduled: ${reason}` : existingSession.studentNotes
        }
      })

      // Create new confirmation
      const confirmation: BookingConfirmation = {
        bookingId: updatedSession.id,
        consultantId: updatedSession.consultantId,
        studentId: updatedSession.studentId,
        startTime: updatedSession.scheduledStart,
        endTime: updatedSession.scheduledEnd,
        duration: (updatedSession.scheduledEnd.getTime() - updatedSession.scheduledStart.getTime()) / (1000 * 60),
        status: 'RESCHEDULED',
        confirmationCode: this.generateConfirmationCode(),
        joinUrl: `/video/session/${updatedSession.id}`,
        consultantInfo: {
          id: existingSession.consultant.id,
          name: `${existingSession.consultant.user.firstName} ${existingSession.consultant.user.lastName}`,
          email: existingSession.consultant.user.email,
          specialties: existingSession.consultant.specialties || [],
          rating: 4.5,
          timezone: existingSession.consultant.timezone || 'UTC'
        }
      }

      // Send rescheduling notifications
      await this.sendReschedulingNotifications(confirmation, reason)

      return confirmation
    } catch (error) {
      console.error('Error rescheduling session:', error)
      throw new Error('Failed to reschedule session')
    }
  }

  static async cancelSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = await db.consultationSession.findUnique({
        where: { id: sessionId },
        include: {
          consultant: { include: { user: true } },
          student: { include: { user: true } }
        }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      // Update session status
      await db.consultationSession.update({
        where: { id: sessionId },
        data: {
          status: 'CANCELLED',
          studentNotes: reason ? `${session.studentNotes || ''}\nCancelled: ${reason}` : session.studentNotes
        }
      })

      // Send cancellation notifications
      await this.sendCancellationNotifications(session, reason)
    } catch (error) {
      console.error('Error cancelling session:', error)
      throw new Error('Failed to cancel session')
    }
  }

  // Conflict Detection
  private static async checkBookingConflicts(bookingRequest: BookingRequest): Promise<SchedulingConflict[]> {
    const conflicts: SchedulingConflict[] = []

    // Check for double booking
    const existingBookings = await db.consultationSession.findMany({
      where: {
        consultantId: bookingRequest.consultantId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            scheduledStart: { lt: bookingRequest.endTime },
            scheduledEnd: { gt: bookingRequest.startTime }
          }
        ]
      }
    })

    if (existingBookings.length > 0) {
      conflicts.push({
        type: 'DOUBLE_BOOKING',
        message: 'Consultant is already booked for this time slot'
      })
    }

    // Check minimum notice
    const now = new Date()
    const hoursUntilSession = (bookingRequest.startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    const consultant = await db.consultant.findUnique({
      where: { id: bookingRequest.consultantId }
    })

    if (consultant && hoursUntilSession < 24) { // Default 24 hours notice
      conflicts.push({
        type: 'MINIMUM_NOTICE',
        message: `Booking must be made at least 24 hours in advance`
      })
    }

    return conflicts
  }

  // Helper Methods
  private static generateTimeSlotsFromAvailability(
    availability: any,
    dateRange: { start: Date; end: Date }
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const currentDate = new Date(dateRange.start)

    while (currentDate <= dateRange.end) {
      if (availability.availabilityType === 'RECURRING_WEEKLY') {
        if (availability.dayOfWeek === currentDate.getDay()) {
          const slot = this.createTimeSlotFromAvailability(availability, currentDate)
          slots.push(slot)
        }
      } else if (availability.availabilityType === 'ONE_TIME') {
        if (availability.specificDate && 
            availability.specificDate.toDateString() === currentDate.toDateString()) {
          const slot = this.createTimeSlotFromAvailability(availability, currentDate)
          slots.push(slot)
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return slots
  }

  private static createTimeSlotFromAvailability(availability: any, date: Date): TimeSlot {
    const [startHour, startMinute] = availability.startTime.split(':').map(Number)
    const [endHour, endMinute] = availability.endTime.split(':').map(Number)

    const startTime = new Date(date)
    startTime.setHours(startHour, startMinute, 0, 0)

    const endTime = new Date(date)
    endTime.setHours(endHour, endMinute, 0, 0)

    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60)

    return {
      id: `slot_${availability.id}_${date.getTime()}`,
      consultantId: availability.consultantId,
      startTime,
      endTime,
      duration,
      status: 'AVAILABLE',
      isRecurring: availability.availabilityType === 'RECURRING_WEEKLY',
      dayOfWeek: availability.dayOfWeek,
      timezone: availability.timezone,
      maxSessions: availability.maxSessions,
      currentBookings: 0
    }
  }

  private static slotsOverlap(slot1: TimeSlot, slot2: { startTime: Date; endTime: Date }): boolean {
    return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime
  }

  private static filterSlotsByPreferences(
    slots: TimeSlot[],
    preferences: BookingPreferences,
    consultant: any
  ): TimeSlot[] {
    return slots.filter(slot => {
      // Check duration preference
      if (preferences.preferredDuration && slot.duration !== preferences.preferredDuration) {
        return false
      }

      // Check time preferences
      const slotTime = slot.startTime.toTimeString().slice(0, 5)
      if (preferences.avoidTimes && preferences.avoidTimes.includes(slotTime)) {
        return false
      }

      return true
    })
  }

  private static async scoreSlots(
    slots: TimeSlot[],
    studentId: string,
    preferences: BookingPreferences
  ): Promise<(TimeSlot & { score: number })[]> {
    const scoredSlots = await Promise.all(
      slots.map(async (slot) => {
        let score = 100

        // Prefer slots with preferred consultants
        if (preferences.preferredConsultants?.includes(slot.consultantId)) {
          score += 20
        }

        // Prefer slots in preferred time ranges
        const slotTime = slot.startTime.toTimeString().slice(0, 5)
        if (preferences.preferredTimeSlots?.includes(slotTime)) {
          score += 15
        }

        // Prefer slots with fewer current bookings
        score += (slot.maxSessions - slot.currentBookings) * 5

        // Prefer slots closer to now (but not too close)
        const hoursUntilSlot = (slot.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
        if (hoursUntilSlot > 24 && hoursUntilSlot < 168) { // 1-7 days
          score += 10
        }

        return { ...slot, score }
      })
    )

    return scoredSlots
  }

  private static generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  private static async sendBookingNotifications(confirmation: BookingConfirmation): Promise<void> {
    // In production, this would send emails/SMS
    console.log('Sending booking notifications for:', confirmation.bookingId)
  }

  private static async sendReschedulingNotifications(
    confirmation: BookingConfirmation,
    reason?: string
  ): Promise<void> {
    // In production, this would send emails/SMS
    console.log('Sending rescheduling notifications for:', confirmation.bookingId)
  }

  private static async sendCancellationNotifications(
    session: any,
    reason?: string
  ): Promise<void> {
    // In production, this would send emails/SMS
    console.log('Sending cancellation notifications for:', session.id)
  }
} 