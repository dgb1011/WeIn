import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  data?: Record<string, any>
}

interface NotificationPreferences {
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  notificationTypes: Record<string, {
    email: boolean
    sms: boolean
    inApp: boolean
    push: boolean
  }>
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=${limit}&offset=${offset}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setError('Failed to mark notification as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read',
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      // Reset unread count
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      setError('Failed to mark all notifications as read')
    }
  }, [user?.id])

  const sendNotification = useCallback(async (notificationData: {
    type: string
    title: string
    message: string
    data?: Record<string, any>
    priority?: string
  }) => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...notificationData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }

      // Refresh notifications to show the new one
      await fetchNotifications()
    } catch (error) {
      console.error('Error sending notification:', error)
      setError('Failed to send notification')
    }
  }, [user?.id, fetchNotifications])

  const sendSessionNotification = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/notifications/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to send session notification')
      }

      // Refresh notifications
      await fetchNotifications()
    } catch (error) {
      console.error('Error sending session notification:', error)
      setError('Failed to send session notification')
    }
  }, [fetchNotifications])

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    }
  }, [user?.id, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
    sendSessionNotification,
  }
}

export function useNotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notifications/preferences?userId=${user.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }
      
      const data = await response.json()
      setPreferences(data)
    } catch (error) {
      console.error('Error fetching preferences:', error)
      setError('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          ...newPreferences,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      // Update local state
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null)
    } catch (error) {
      console.error('Error updating preferences:', error)
      setError('Failed to update notification preferences')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Fetch preferences on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchPreferences()
    }
  }, [user?.id, fetchPreferences])

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
  }
} 