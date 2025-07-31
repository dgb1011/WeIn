'use client'

import React, { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Info,
  Calendar,
  FileText,
  Award,
  DollarSign,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NotificationType } from '@/lib/services/notificationService'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  data?: Record<string, any>
}

interface NotificationListProps {
  userId: string
  onNotificationUpdate?: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case NotificationType.SESSION_SCHEDULED:
    case NotificationType.SESSION_REMINDER_24H:
    case NotificationType.SESSION_REMINDER_2H:
    case NotificationType.SESSION_REMINDER_15M:
      return <Calendar className="h-4 w-4 text-blue-500" />
    
    case NotificationType.SESSION_COMPLETED:
      return <CheckCircle className="h-4 w-4 text-green-500" />
    
    case NotificationType.SESSION_CANCELLED:
      return <XCircle className="h-4 w-4 text-red-500" />
    
    case NotificationType.MILESTONE_REACHED:
    case NotificationType.CERTIFICATION_ELIGIBLE:
    case NotificationType.CERTIFICATION_COMPLETED:
      return <Award className="h-4 w-4 text-yellow-500" />
    
    case NotificationType.DOCUMENT_APPROVED:
    case NotificationType.DOCUMENT_REJECTED:
    case NotificationType.DOCUMENT_UPLOADED:
      return <FileText className="h-4 w-4 text-purple-500" />
    
    case NotificationType.PAYMENT_PROCESSED:
      return <DollarSign className="h-4 w-4 text-green-500" />
    
    case NotificationType.SYSTEM_MAINTENANCE:
    case NotificationType.SYSTEM_UPDATE:
    case NotificationType.SECURITY_ALERT:
      return <Settings className="h-4 w-4 text-orange-500" />
    
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case NotificationType.SESSION_SCHEDULED:
    case NotificationType.SESSION_REMINDER_24H:
    case NotificationType.SESSION_REMINDER_2H:
    case NotificationType.SESSION_REMINDER_15M:
      return 'bg-blue-50 border-blue-200'
    
    case NotificationType.SESSION_COMPLETED:
    case NotificationType.DOCUMENT_APPROVED:
    case NotificationType.PAYMENT_PROCESSED:
      return 'bg-green-50 border-green-200'
    
    case NotificationType.SESSION_CANCELLED:
    case NotificationType.DOCUMENT_REJECTED:
    case NotificationType.SECURITY_ALERT:
      return 'bg-red-50 border-red-200'
    
    case NotificationType.MILESTONE_REACHED:
    case NotificationType.CERTIFICATION_ELIGIBLE:
    case NotificationType.CERTIFICATION_COMPLETED:
      return 'bg-yellow-50 border-yellow-200'
    
    case NotificationType.DOCUMENT_UPLOADED:
      return 'bg-purple-50 border-purple-200'
    
    case NotificationType.SYSTEM_MAINTENANCE:
    case NotificationType.SYSTEM_UPDATE:
      return 'bg-orange-50 border-orange-200'
    
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export function NotificationList({ userId, onNotificationUpdate }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?userId=${userId}&limit=20`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      
      const data = await response.json()
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
        }),
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      
      onNotificationUpdate?.()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_all_read',
          userId,
        }),
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      
      onNotificationUpdate?.()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Loading notifications...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No notifications
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <Separator className="mb-2" />
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
              !notification.read ? 'ring-2 ring-blue-200' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 h-auto p-1"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {notifications.length >= 20 && (
        <div className="mt-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
} 