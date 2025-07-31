import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const preferences = await db.userNotificationPreferences.findUnique({
      where: { userId }
    })

    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        userId,
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC'
        },
        notificationTypes: {
          SESSION_SCHEDULED: { email: true, sms: false, inApp: true, push: false },
          SESSION_REMINDER_24H: { email: true, sms: true, inApp: true, push: false },
          SESSION_REMINDER_2H: { email: true, sms: true, inApp: true, push: true },
          SESSION_REMINDER_15M: { email: false, sms: true, inApp: true, push: true },
          SESSION_CANCELLED: { email: true, sms: true, inApp: true, push: true },
          SESSION_RESCHEDULED: { email: true, sms: true, inApp: true, push: true },
          SESSION_COMPLETED: { email: true, sms: false, inApp: true, push: false },
          MILESTONE_REACHED: { email: true, sms: false, inApp: true, push: false },
          PROGRESS_UPDATE: { email: false, sms: false, inApp: true, push: false },
          CERTIFICATION_ELIGIBLE: { email: true, sms: true, inApp: true, push: true },
          CERTIFICATION_COMPLETED: { email: true, sms: true, inApp: true, push: true },
          DOCUMENT_UPLOADED: { email: false, sms: false, inApp: true, push: false },
          DOCUMENT_APPROVED: { email: true, sms: false, inApp: true, push: false },
          DOCUMENT_REJECTED: { email: true, sms: true, inApp: true, push: true },
          DOCUMENT_REVIEW_REQUIRED: { email: true, sms: false, inApp: true, push: false },
          SYSTEM_MAINTENANCE: { email: true, sms: false, inApp: true, push: false },
          SYSTEM_UPDATE: { email: true, sms: false, inApp: true, push: false },
          SECURITY_ALERT: { email: true, sms: true, inApp: true, push: true },
          NEW_BOOKING: { email: true, sms: false, inApp: true, push: false },
          SESSION_VERIFICATION_REQUIRED: { email: true, sms: false, inApp: true, push: false },
          PAYMENT_PROCESSED: { email: true, sms: false, inApp: true, push: false },
          USER_REGISTRATION: { email: false, sms: false, inApp: false, push: false },
          SYSTEM_ALERT: { email: true, sms: false, inApp: true, push: false },
          PERFORMANCE_METRIC: { email: false, sms: false, inApp: false, push: false }
        }
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...preferences } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await notificationService.updateUserPreferences(userId, preferences)

    return NextResponse.json({ 
      success: true,
      message: 'Notification preferences updated successfully'
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
} 