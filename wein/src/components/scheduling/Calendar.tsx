'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface TimeSlot {
  id: string
  consultantId: string
  startTime: Date
  endTime: Date
  duration: number
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST'
  isRecurring: boolean
  dayOfWeek?: number
  timezone: string
  maxSessions: number
  currentBookings: number
  score?: number
}

interface Consultant {
  id: string
  name: string
  specialties: string[]
  rating: number
  timezone: string
}

interface CalendarProps {
  consultantId?: string
  onSlotSelect?: (slot: TimeSlot) => void
  onDateChange?: (date: Date) => void
  showConsultantInfo?: boolean
}

export default function Calendar({ 
  consultantId, 
  onSlotSelect, 
  onDateChange,
  showConsultantInfo = false 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const days = getDaysInMonth(currentDate)

  // Load availability data
  useEffect(() => {
    loadAvailability()
  }, [currentDate, consultantId])

  const loadAvailability = async () => {
    try {
      setIsLoading(true)

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      if (consultantId) {
        // Load specific consultant availability
        const response = await fetch(
          `/api/scheduling?action=availability&consultantId=${consultantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includeBooked=true`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setTimeSlots(data.availability)
        }
      } else {
        // Load available slots from all consultants
        const response = await fetch(
          `/api/scheduling?action=availableSlots&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setTimeSlots(data.slots)
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSlotsForDate = (date: Date) => {
    if (!date) return []
    
    return timeSlots.filter(slot => {
      const slotDate = new Date(slot.startTime)
      return slotDate.toDateString() === date.toDateString()
    })
  }

  const getConsultantForSlot = (slot: TimeSlot) => {
    return consultants.find(c => c.id === slot.consultantId)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateChange?.(date)
  }

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setShowBookingDialog(true)
    onSlotSelect?.(slot)
  }

  const handleBookingConfirm = async () => {
    if (!selectedSlot) return

    try {
      const response = await fetch('/api/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action: 'bookSession',
          consultantId: selectedSlot.consultantId,
          startTime: selectedSlot.startTime.toISOString(),
          endTime: selectedSlot.endTime.toISOString(),
          sessionType: 'EMDR_CONSULTATION'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShowBookingDialog(false)
        setSelectedSlot(null)
        
        // Reload availability to reflect the booking
        await loadAvailability()
        
        // Show success message
        alert('Session booked successfully!')
      } else {
        const error = await response.json()
        alert(`Booking failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error booking session:', error)
      alert('Failed to book session. Please try again.')
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const getDayClass = (date: Date | null) => {
    if (!date) return 'p-2'
    
    let classes = 'p-2 cursor-pointer hover:bg-gray-100 rounded'
    
    if (isToday(date)) {
      classes += ' bg-blue-100 font-semibold'
    }
    
    if (isSelected(date)) {
      classes += ' bg-blue-500 text-white'
    }
    
    return classes
  }

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'BOOKED':
        return 'bg-red-100 text-red-800'
      case 'BLOCKED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
              setCurrentDate(newDate)
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <div key={index} className="min-h-[100px] border border-gray-200">
                {date && (
                  <>
                    <div className={getDayClass(date)} onClick={() => handleDateClick(date)}>
                      {date.getDate()}
                    </div>
                    
                    {/* Time Slots for Selected Date */}
                    {isSelected(date) && (
                      <div className="p-2 space-y-1">
                        {getSlotsForDate(date).map(slot => (
                          <div
                            key={slot.id}
                            className={`text-xs p-1 rounded cursor-pointer ${getSlotStatusColor(slot.status)}`}
                            onClick={() => slot.status === 'AVAILABLE' && handleSlotClick(slot)}
                          >
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(slot.startTime)}</span>
                            </div>
                            {showConsultantInfo && getConsultantForSlot(slot) && (
                              <div className="flex items-center space-x-1 mt-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{getConsultantForSlot(slot)?.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Available Slots for {formatDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading availability...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {getSlotsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No available slots for this date</p>
                ) : (
                  getSlotsForDate(selectedDate)
                    .filter(slot => slot.status === 'AVAILABLE')
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                    .map(slot => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSlotClick(slot)}
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {slot.duration} minutes
                            </p>
                          </div>
                        </div>
                        
                        {showConsultantInfo && getConsultantForSlot(slot) && (
                          <div className="text-right">
                            <p className="font-medium">{getConsultantForSlot(slot)?.name}</p>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm">{getConsultantForSlot(slot)?.rating}</span>
                            </div>
                          </div>
                        )}
                        
                        <Badge variant="default">Available</Badge>
                      </div>
                    ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Session Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDate(selectedSlot.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{selectedSlot.duration} minutes</span>
                  </div>
                  {showConsultantInfo && getConsultantForSlot(selectedSlot) && (
                    <div className="flex justify-between">
                      <span>Consultant:</span>
                      <span>{getConsultantForSlot(selectedSlot)?.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBookingConfirm}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 