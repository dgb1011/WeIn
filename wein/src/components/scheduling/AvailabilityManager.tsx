'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface AvailabilitySlot {
  id: string
  consultantId: string
  availabilityType: 'RECURRING_WEEKLY' | 'ONE_TIME' | 'BLOCKED_TIME' | 'HOLIDAY_BLOCK'
  dayOfWeek?: number
  specificDate?: Date
  startTime: string
  endTime: string
  maxSessions: number
  bufferMinutes: number
  isAvailable: boolean
  bookingWindowDays: number
  minimumNoticeHours: number
  timezone: string
  recurringPattern?: any
}

interface AvailabilityFormData {
  availabilityType: 'RECURRING_WEEKLY' | 'ONE_TIME' | 'BLOCKED_TIME' | 'HOLIDAY_BLOCK'
  dayOfWeek?: number
  specificDate?: string
  startTime: string
  endTime: string
  maxSessions: number
  bufferMinutes: number
  isAvailable: boolean
  bookingWindowDays: number
  minimumNoticeHours: number
  timezone: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30'
]

export default function AvailabilityManager() {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null)
  const [formData, setFormData] = useState<AvailabilityFormData>({
    availabilityType: 'RECURRING_WEEKLY',
    startTime: '09:00',
    endTime: '10:00',
    maxSessions: 1,
    bufferMinutes: 15,
    isAvailable: true,
    bookingWindowDays: 30,
    minimumNoticeHours: 24,
    timezone: 'UTC'
  })

  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/consultants?action=availability', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailabilitySlots(data.availability)
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        specificDate: formData.specificDate ? new Date(formData.specificDate).toISOString() : undefined
      }

      const response = await fetch('/api/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: editingSlot ? 'updateAvailability' : 'addAvailability',
          slotId: editingSlot?.id,
          ...submitData
        })
      })

      if (response.ok) {
        setShowAddDialog(false)
        setEditingSlot(null)
        resetForm()
        await loadAvailability()
      } else {
        const error = await response.json()
        alert(`Failed to save availability: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Failed to save availability. Please try again.')
    }
  }

  const handleEdit = (slot: AvailabilitySlot) => {
    setEditingSlot(slot)
    setFormData({
      availabilityType: slot.availabilityType,
      dayOfWeek: slot.dayOfWeek,
      specificDate: slot.specificDate ? new Date(slot.specificDate).toISOString().split('T')[0] : undefined,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxSessions: slot.maxSessions,
      bufferMinutes: slot.bufferMinutes,
      isAvailable: slot.isAvailable,
      bookingWindowDays: slot.bookingWindowDays,
      minimumNoticeHours: slot.minimumNoticeHours,
      timezone: slot.timezone
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      const response = await fetch(`/api/consultants?slotId=${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        await loadAvailability()
      } else {
        const error = await response.json()
        alert(`Failed to delete availability: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting availability:', error)
      alert('Failed to delete availability. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      availabilityType: 'RECURRING_WEEKLY',
      startTime: '09:00',
      endTime: '10:00',
      maxSessions: 1,
      bufferMinutes: 15,
      isAvailable: true,
      bookingWindowDays: 30,
      minimumNoticeHours: 24,
      timezone: 'UTC'
    })
  }

  const handleAddNew = () => {
    setEditingSlot(null)
    resetForm()
    setShowAddDialog(true)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailabilityTypeLabel = (type: string) => {
    switch (type) {
      case 'RECURRING_WEEKLY':
        return 'Weekly Recurring'
      case 'ONE_TIME':
        return 'One Time'
      case 'BLOCKED_TIME':
        return 'Blocked Time'
      case 'HOLIDAY_BLOCK':
        return 'Holiday Block'
      default:
        return type
    }
  }

  const getDayLabel = (dayOfWeek?: number) => {
    if (dayOfWeek === undefined) return 'N/A'
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Availability Management</h2>
          <p className="text-gray-600">Manage your consultation availability and scheduling preferences</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSlot ? 'Edit Availability' : 'Add Availability'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Availability Type */}
              <div>
                <Label htmlFor="availabilityType">Type</Label>
                <Select
                  value={formData.availabilityType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, availabilityType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECURRING_WEEKLY">Weekly Recurring</SelectItem>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                    <SelectItem value="BLOCKED_TIME">Blocked Time</SelectItem>
                    <SelectItem value="HOLIDAY_BLOCK">Holiday Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Week (for recurring) */}
              {formData.availabilityType === 'RECURRING_WEEKLY' && (
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={formData.dayOfWeek?.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Specific Date (for one time) */}
              {formData.availabilityType === 'ONE_TIME' && (
                <div>
                  <Label htmlFor="specificDate">Date</Label>
                  <Input
                    type="date"
                    value={formData.specificDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, specificDate: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Session Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxSessions">Max Sessions</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxSessions}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSessions: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bufferMinutes">Buffer (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.bufferMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Booking Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bookingWindowDays">Booking Window (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.bookingWindowDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingWindowDays: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="minimumNoticeHours">Min Notice (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={formData.minimumNoticeHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumNoticeHours: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Available Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label>Available for booking</Label>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSlot ? 'Update' : 'Add'} Availability
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Availability List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Availability</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading availability...</p>
            </div>
          ) : availabilitySlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No availability slots configured</p>
              <p className="text-sm text-gray-500">Add your first availability slot to start accepting bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availabilitySlots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                        {getAvailabilityTypeLabel(slot.availabilityType)}
                      </Badge>
                      
                      {slot.availabilityType === 'RECURRING_WEEKLY' && (
                        <Badge variant="outline">
                          {getDayLabel(slot.dayOfWeek)}
                        </Badge>
                      )}
                      
                      {slot.availabilityType === 'ONE_TIME' && slot.specificDate && (
                        <Badge variant="outline">
                          {new Date(slot.specificDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slot)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 