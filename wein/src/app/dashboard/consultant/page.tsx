'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Settings
} from 'lucide-react'

interface ConsultantStats {
  totalSessions: number
  totalHours: number
  totalEarnings: number
  averageRating: number
  pendingSessions: number
  completedSessions: number
}

interface Session {
  id: string
  studentName: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  studentVerified: boolean
  consultantVerified: boolean
}

export default function ConsultantDashboard() {
  const [stats, setStats] = useState<ConsultantStats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API calls
    // For now, using mock data
    setStats({
      totalSessions: 24,
      totalHours: 18.5,
      totalEarnings: 2775.00,
      averageRating: 4.8,
      pendingSessions: 3,
      completedSessions: 21
    })

    setSessions([
      {
        id: '1',
        studentName: 'Alex Smith',
        scheduledStart: '2024-02-01T10:00:00Z',
        scheduledEnd: '2024-02-01T11:00:00Z',
        status: 'COMPLETED',
        studentVerified: true,
        consultantVerified: true
      },
      {
        id: '2',
        studentName: 'Sarah Johnson',
        scheduledStart: '2024-02-08T14:00:00Z',
        scheduledEnd: '2024-02-08T15:00:00Z',
        status: 'SCHEDULED',
        studentVerified: false,
        consultantVerified: false
      },
      {
        id: '3',
        studentName: 'Mike Davis',
        scheduledStart: '2024-02-05T16:00:00Z',
        scheduledEnd: '2024-02-05T17:00:00Z',
        status: 'COMPLETED',
        studentVerified: true,
        consultantVerified: false
      }
    ])

    setIsLoading(false)
  }, [])

  const handleVerifySession = (sessionId: string) => {
    // TODO: Implement session verification
    console.log('Verifying session:', sessionId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Consultant Dashboard</h1>
                <p className="text-gray-600">Manage your consultation sessions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Availability
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                consultation hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.totalEarnings?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRating || 0}</div>
              <p className="text-xs text-muted-foreground">
                out of 5 stars
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Verifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Pending Verifications
                  </CardTitle>
                  <CardDescription>
                    Sessions waiting for your verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.filter(s => s.status === 'COMPLETED' && !s.consultantVerified).length > 0 ? (
                    <div className="space-y-4">
                      {sessions.filter(s => s.status === 'COMPLETED' && !s.consultantVerified).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {session.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.studentName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.scheduledStart).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleVerifySession(session.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">All sessions verified</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription>
                    Your scheduled consultation sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.filter(s => s.status === 'SCHEDULED').length > 0 ? (
                    <div className="space-y-4">
                      {sessions.filter(s => s.status === 'SCHEDULED').map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {session.studentName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{session.studentName}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.scheduledStart).toLocaleDateString()} at{' '}
                                {new Date(session.scheduledStart).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>
                  View and manage all your consultation sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Student Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.studentName}
                        </TableCell>
                        <TableCell>
                          {new Date(session.scheduledStart).toLocaleDateString()}<br/>
                          <span className="text-sm text-gray-500">
                            {new Date(session.scheduledStart).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.studentVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            {session.status === 'COMPLETED' && !session.consultantVerified && (
                              <Button 
                                size="sm"
                                onClick={() => handleVerifySession(session.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Management</CardTitle>
                <CardDescription>
                  Set your consultation availability and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Availability settings coming soon</p>
                  <Button className="mt-4">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Availability
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                  Track your consultation income and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${stats?.totalEarnings?.toLocaleString() || 0}
                    </div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      ${((stats?.totalEarnings || 0) / 12).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600">Average per Month</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      ${((stats?.totalEarnings || 0) / (stats?.totalHours || 1)).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600">Per Hour Rate</p>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Detailed earnings reports coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 