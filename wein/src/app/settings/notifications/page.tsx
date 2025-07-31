'use client'

import React from 'react'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Settings } from 'lucide-react'

export default function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Notification Settings</h1>
        </div>
        <p className="text-gray-600">
          Customize how and when you receive notifications from the BrainBased EMDR platform.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Quick Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Overview
            </CardTitle>
            <CardDescription>
              Understand how notifications work in the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Session Notifications</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Session scheduling confirmations</li>
                  <li>• Reminders (24h, 2h, 15min before)</li>
                  <li>• Cancellation and rescheduling alerts</li>
                  <li>• Session completion confirmations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Progress Notifications</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Milestone achievements</li>
                  <li>• Progress updates</li>
                  <li>• Certification eligibility</li>
                  <li>• Document approval status</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Component */}
        <NotificationPreferences />
      </div>
    </div>
  )
} 