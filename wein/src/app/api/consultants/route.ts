import { NextRequest, NextResponse } from 'next/server'
import { ConsultantService } from '@/lib/services/consultantService'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'CONSULTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'profile') {
      const profile = await ConsultantService.getConsultantProfile(user.id)
      return NextResponse.json({ profile })
    }

    if (action === 'availability') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined

      const availability = await ConsultantService.getConsultantAvailability(user.id, dateRange)
      return NextResponse.json({ availability })
    }

    if (action === 'pendingVerifications') {
      const verifications = await ConsultantService.getPendingVerifications(user.id)
      return NextResponse.json({ verifications })
    }

    if (action === 'paymentSummary') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined

      const summary = await ConsultantService.getPaymentSummary(user.id, dateRange)
      return NextResponse.json({ summary })
    }

    if (action === 'sessionHistory') {
      const status = searchParams.get('status')?.split(',')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate)
      } : undefined

      const history = await ConsultantService.getSessionHistory(user.id, {
        status: status as any,
        limit,
        offset,
        dateRange
      })

      return NextResponse.json(history)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Consultant API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'CONSULTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'addAvailability') {
      const slot = await ConsultantService.addAvailabilitySlot(user.id, data)
      return NextResponse.json({ slot })
    }

    if (action === 'verifySession') {
      const { sessionId, notes } = data
      await ConsultantService.verifySession(sessionId, user.id, notes)
      return NextResponse.json({ message: 'Session verified successfully' })
    }

    if (action === 'bulkVerifySessions') {
      const { sessionIds } = data
      await ConsultantService.bulkVerifySessions(sessionIds, user.id)
      return NextResponse.json({ message: 'Sessions verified successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Consultant API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'CONSULTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'updateProfile') {
      const profile = await ConsultantService.updateConsultantProfile(user.id, data)
      return NextResponse.json({ profile })
    }

    if (action === 'updateAvailability') {
      const { slotId, ...updates } = data
      const slot = await ConsultantService.updateAvailabilitySlot(slotId, updates)
      return NextResponse.json({ slot })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Consultant API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.userType !== 'CONSULTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('slotId')

    if (slotId) {
      await ConsultantService.deleteAvailabilitySlot(slotId)
      return NextResponse.json({ message: 'Availability slot deleted successfully' })
    }

    return NextResponse.json({ error: 'Slot ID required' }, { status: 400 })
  } catch (error) {
    console.error('Consultant API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 