import { NextRequest, NextResponse } from 'next/server'
import { SchedulingService } from '@/lib/services/schedulingService'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'availability') {
      const consultantId = searchParams.get('consultantId')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const includeBooked = searchParams.get('includeBooked') === 'true'

      if (!consultantId || !startDate || !endDate) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
      }

      const availability = await SchedulingService.getConsultantAvailability(
        consultantId,
        {
          start: new Date(startDate),
          end: new Date(endDate)
        },
        includeBooked
      )

      return NextResponse.json({ availability })
    }

    if (action === 'availableSlots') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const preferredDuration = parseInt(searchParams.get('preferredDuration') || '60')
      const preferredTimeSlots = searchParams.get('preferredTimeSlots')?.split(',') || []
      const avoidTimes = searchParams.get('avoidTimes')?.split(',') || []
      const preferredConsultants = searchParams.get('preferredConsultants')?.split(',') || []

      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
      }

      const preferences = {
        preferredDuration,
        preferredTimeSlots,
        avoidTimes,
        preferredConsultants
      }

      const slots = await SchedulingService.findAvailableSlots(
        user.id,
        preferences,
        {
          start: new Date(startDate),
          end: new Date(endDate)
        }
      )

      return NextResponse.json({ slots })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Scheduling API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'addAvailability') {
      if (user.userType !== 'CONSULTANT') {
        return NextResponse.json({ error: 'Only consultants can add availability' }, { status: 403 })
      }

      const slot = await SchedulingService.addAvailabilitySlot(user.id, data)
      return NextResponse.json({ slot })
    }

    if (action === 'bookSession') {
      if (user.userType !== 'STUDENT') {
        return NextResponse.json({ error: 'Only students can book sessions' }, { status: 403 })
      }

      const bookingRequest = {
        ...data,
        studentId: user.id
      }

      const confirmation = await SchedulingService.bookSession(bookingRequest)
      return NextResponse.json({ confirmation })
    }

    if (action === 'rescheduleSession') {
      const { sessionId, newStartTime, newEndTime, reason } = data

      const confirmation = await SchedulingService.rescheduleSession(
        sessionId,
        new Date(newStartTime),
        new Date(newEndTime),
        reason
      )

      return NextResponse.json({ confirmation })
    }

    if (action === 'cancelSession') {
      const { sessionId, reason } = data

      await SchedulingService.cancelSession(sessionId, reason)
      return NextResponse.json({ message: 'Session cancelled successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Scheduling API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 