import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/services/notificationService'
import { NotificationType, NotificationPriority } from '@/lib/services/notificationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const notifications = await notificationService.getUserNotifications(userId, limit, offset)
    const unreadCount = await notificationService.getUnreadNotificationCount(userId)

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data, priority } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      )
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      )
    }

    // Validate priority
    if (priority && !Object.values(NotificationPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid notification priority' },
        { status: 400 }
      )
    }

    await notificationService.sendNotification({
      userId,
      type,
      title,
      message,
      data,
      priority: priority || NotificationPriority.NORMAL
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationId, userId } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'mark_read':
        if (!notificationId) {
          return NextResponse.json(
            { error: 'Notification ID is required for mark_read action' },
            { status: 400 }
          )
        }
        await notificationService.markNotificationAsRead(notificationId)
        break

      case 'mark_all_read':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for mark_all_read action' },
            { status: 400 }
          )
        }
        await notificationService.markAllNotificationsAsRead(userId)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
} 