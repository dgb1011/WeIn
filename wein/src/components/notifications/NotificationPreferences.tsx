'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Clock,
  Save,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NotificationType } from '@/lib/services/notificationService'

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
  notificationTypes: {
    [key in NotificationType]: {
      email: boolean
      sms: boolean
      inApp: boolean
      push: boolean
    }
  }
}

const notificationTypeLabels: Record<NotificationType, string> = {
  SESSION_SCHEDULED: 'Session Scheduled',
  SESSION_REMINDER_24H: '24 Hour Reminder',
  SESSION_REMINDER_2H: '2 Hour Reminder',
  SESSION_REMINDER_15M: '15 Minute Reminder',
  SESSION_CANCELLED: 'Session Cancelled',
  SESSION_RESCHEDULED: 'Session Rescheduled',
  SESSION_COMPLETED: 'Session Completed',
  MILESTONE_REACHED: 'Milestone Reached',
  PROGRESS_UPDATE: 'Progress Update',
  CERTIFICATION_ELIGIBLE: 'Certification Eligible',
  CERTIFICATION_COMPLETED: 'Certification Completed',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  DOCUMENT_APPROVED: 'Document Approved',
  DOCUMENT_REJECTED: 'Document Rejected',
  DOCUMENT_REVIEW_REQUIRED: 'Document Review Required',
  SYSTEM_MAINTENANCE: 'System Maintenance',
  SYSTEM_UPDATE: 'System Update',
  SECURITY_ALERT: 'Security Alert',
  NEW_BOOKING: 'New Booking',
  SESSION_VERIFICATION_REQUIRED: 'Session Verification Required',
  PAYMENT_PROCESSED: 'Payment Processed',
  USER_REGISTRATION: 'User Registration',
  SYSTEM_ALERT: 'System Alert',
  PERFORMANCE_METRIC: 'Performance Metric'
}

const notificationTypeCategories = {
  'Session Management': [
    NotificationType.SESSION_SCHEDULED,
    NotificationType.SESSION_REMINDER_24H,
    NotificationType.SESSION_REMINDER_2H,
    NotificationType.SESSION_REMINDER_15M,
    NotificationType.SESSION_CANCELLED,
    NotificationType.SESSION_RESCHEDULED,
    NotificationType.SESSION_COMPLETED
  ],
  'Progress & Certification': [
    NotificationType.MILESTONE_REACHED,
    NotificationType.PROGRESS_UPDATE,
    NotificationType.CERTIFICATION_ELIGIBLE,
    NotificationType.CERTIFICATION_COMPLETED
  ],
  'Documents': [
    NotificationType.DOCUMENT_UPLOADED,
    NotificationType.DOCUMENT_APPROVED,
    NotificationType.DOCUMENT_REJECTED,
    NotificationType.DOCUMENT_REVIEW_REQUIRED
  ],
  'System & Security': [
    NotificationType.SYSTEM_MAINTENANCE,
    NotificationType.SYSTEM_UPDATE,
    NotificationType.SECURITY_ALERT,
    NotificationType.SYSTEM_ALERT
  ],
  'Consultant': [
    NotificationType.NEW_BOOKING,
    NotificationType.SESSION_VERIFICATION_REQUIRED,
    NotificationType.PAYMENT_PROCESSED
  ]
}

export function NotificationPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchPreferences()
    }
  }, [user?.id])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications/preferences?userId=${user?.id}`)
      
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
  }

  const savePreferences = async () => {
    if (!preferences || !user?.id) return

    try {
      setSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          emailEnabled: preferences.emailEnabled,
          smsEnabled: preferences.smsEnabled,
          inAppEnabled: preferences.inAppEnabled,
          pushEnabled: preferences.pushEnabled,
          quietHours: preferences.quietHours,
          notificationTypes: preferences.notificationTypes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      // Show success message or toast
      console.log('Preferences saved successfully')
    } catch (error) {
      console.error('Error saving preferences:', error)
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const updateChannelPreference = (channel: keyof Pick<NotificationPreferences, 'emailEnabled' | 'smsEnabled' | 'inAppEnabled' | 'pushEnabled'>, value: boolean) => {
    if (!preferences) return
    setPreferences(prev => prev ? { ...prev, [channel]: value } : null)
  }

  const updateNotificationTypePreference = (type: NotificationType, channel: 'email' | 'sms' | 'inApp' | 'push', value: boolean) => {
    if (!preferences) return
    setPreferences(prev => {
      if (!prev) return null
      return {
        ...prev,
        notificationTypes: {
          ...prev.notificationTypes,
          [type]: {
            ...prev.notificationTypes[type],
            [channel]: value
          }
        }
      }
    })
  }

  const updateQuietHours = (field: keyof NotificationPreferences['quietHours'], value: string | boolean) => {
    if (!preferences) return
    setPreferences(prev => {
      if (!prev) return null
      return {
        ...prev,
        quietHours: {
          ...prev.quietHours,
          [field]: value
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading preferences...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="p-4 text-center text-gray-500">
        No preferences found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <p className="text-gray-600">Configure how and when you receive notifications</p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => updateChannelPreference('emailEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-green-500" />
              <div>
                <Label htmlFor="inapp-enabled">In-App Notifications</Label>
                <p className="text-sm text-gray-500">Show notifications within the application</p>
              </div>
            </div>
            <Switch
              id="inapp-enabled"
              checked={preferences.inAppEnabled}
              onCheckedChange={(checked) => updateChannelPreference('inAppEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="sms-enabled">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive text message notifications</p>
              </div>
            </div>
            <Switch
              id="sms-enabled"
              checked={preferences.smsEnabled}
              onCheckedChange={(checked) => updateChannelPreference('smsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
            <Switch
              id="quiet-hours-enabled"
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={preferences.quietHours.startTime}
                  onChange={(e) => updateQuietHours('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={preferences.quietHours.endTime}
                  onChange={(e) => updateQuietHours('endTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.quietHours.timezone}
                  onValueChange={(value) => updateQuietHours('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(notificationTypeCategories).map(([category, types]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold mb-3">{category}</h3>
              <div className="space-y-3">
                {types.map((type) => (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">{notificationTypeLabels[type]}</Label>
                      <Badge variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={preferences.notificationTypes[type].email}
                          onCheckedChange={(checked) => updateNotificationTypePreference(type, 'email', checked)}
                          disabled={!preferences.emailEnabled}
                        />
                        <Label className="text-xs">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={preferences.notificationTypes[type].inApp}
                          onCheckedChange={(checked) => updateNotificationTypePreference(type, 'inApp', checked)}
                          disabled={!preferences.inAppEnabled}
                        />
                        <Label className="text-xs">In-App</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={preferences.notificationTypes[type].sms}
                          onCheckedChange={(checked) => updateNotificationTypePreference(type, 'sms', checked)}
                          disabled={!preferences.smsEnabled}
                        />
                        <Label className="text-xs">SMS</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={preferences.notificationTypes[type].push}
                          onCheckedChange={(checked) => updateNotificationTypePreference(type, 'push', checked)}
                          disabled={!preferences.pushEnabled}
                        />
                        <Label className="text-xs">Push</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
} 