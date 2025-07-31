'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, User, Star, MapPin, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Calendar from '@/components/scheduling/Calendar'

interface Consultant {
  id: string
  name: string
  email: string
  specialties: string[]
  rating: number
  timezone: string
  totalSessions: number
  totalHours: number
}

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

export default function SchedulingPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    loadConsultants()
  }, [])

  useEffect(() => {
    if (selectedConsultant) {
      loadAvailableSlots()
    }
  }, [selectedConsultant, selectedDate])

  const loadConsultants = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/consultants?action=sessionHistory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConsultants(data.sessions.map((session: any) => ({
          id: session.consultant.id,
          name: `${session.consultant.user.firstName} ${session.consultant.user.lastName}`,
          email: session.consultant.user.email,
          specialties: session.consultant.specialties || [],
          rating: 4.5, // Mock rating
          timezone: session.consultant.timezone || 'UTC',
          totalSessions: 0,
          totalHours: 0
        })))
      }
    } catch (error) {
      console.error('Error loading consultants:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!selectedConsultant) return

    try {
      setIsLoading(true)
      
      const startDate = new Date(selectedDate)
      startDate.setDate(startDate.getDate() - 7) // 1 week before
      
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 30) // 4 weeks after

      const response = await fetch(
        `/api/scheduling?action=availableSlots&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&preferredConsultants=${selectedConsultant.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConsultantSelect = (consultant: Consultant) => {
    setSelectedConsultant(consultant)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    // Handle slot selection - this would typically open a booking dialog
    console.log('Selected slot:', slot)
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const filteredConsultants = consultants.filter(consultant => {
    const matchesSearch = consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultant.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSpecialty = !selectedSpecialty || consultant.specialties.includes(selectedSpecialty)
    return matchesSearch && matchesSpecialty
  })

  const getSpecialties = () => {
    const allSpecialties = new Set<string>()
    consultants.forEach(consultant => {
      consultant.specialties.forEach(specialty => allSpecialties.add(specialty))
    })
    return Array.from(allSpecialties)
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Schedule Consultation</h1>
        <p className="text-gray-600">Find and book consultation sessions with our EMDR specialists</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Consultants</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All specialties</SelectItem>
                  {getSpecialties().map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>View Mode</Label>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultants List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Consultants</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading consultants...</p>
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No consultants found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredConsultants.map(consultant => (
                    <div
                      key={consultant.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedConsultant?.id === consultant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleConsultantSelect(consultant)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{consultant.name}</h3>
                          <p className="text-sm text-gray-600">{consultant.email}</p>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{consultant.rating}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">{consultant.timezone}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {consultant.specialties.slice(0, 2).map(specialty => (
                              <Badge key={specialty} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {consultant.specialties.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{consultant.specialties.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Availability Calendar/List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedConsultant 
                  ? `Availability for ${selectedConsultant.name}`
                  : 'Select a consultant to view availability'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedConsultant ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Choose a consultant from the list to view their availability</p>
                </div>
              ) : viewMode === 'calendar' ? (
                <Calendar
                  consultantId={selectedConsultant.id}
                  onSlotSelect={handleSlotSelect}
                  onDateChange={handleDateChange}
                  showConsultantInfo={false}
                />
              ) : (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading availability...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No available slots found</p>
                      <p className="text-sm text-gray-500">Try selecting a different date range</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableSlots
                        .filter(slot => slot.status === 'AVAILABLE')
                        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                        .map(slot => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleSlotSelect(slot)}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <div>
                                  <p className="font-medium">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(slot.startTime)} • {slot.duration} minutes
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="default">Available</Badge>
                              {slot.score && (
                                <Badge variant="outline">
                                  Score: {slot.score}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 