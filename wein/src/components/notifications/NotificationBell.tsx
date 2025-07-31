'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationList } from './NotificationList'
import { useAuth } from '@/hooks/useAuth'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount()
    }
  }, [user?.id])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleNotificationClick = () => {
    setIsOpen(!isOpen)
    if (unreadCount > 0) {
      // Mark all as read when opening
      markAllAsRead()
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
          userId: user?.id,
        }),
      })
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
          onClick={handleNotificationClick}
        >
          {unreadCount > 0 ? (
            <>
              <Bell className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <NotificationList 
          userId={user.id} 
          onNotificationUpdate={fetchUnreadCount}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 