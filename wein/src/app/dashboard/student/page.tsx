'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Video, 
  Trophy, 
  TrendingUp,
  BookOpen,
  Upload,
  Plus,
  Eye
} from 'lucide-react'

interface StudentProgress {
  verifiedHours: number
  pendingHours: number
  projectedHours: number
  completionPercentage: number
  remainingHours: number
  estimatedCompletionDate: string
  milestoneStatus: string
}

interface Session {
  id: string
  scheduledStart: string
  scheduledEnd: string
  status: string
  consultant: {
    firstName: string
    lastName: string
  }
}

export default function StudentDashboard() {
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API calls
    // For now, using mock data
    setProgress({
      verifiedHours: 12.5,
      pendingHours: 2.0,
      projectedHours: 8.0,
      completionPercentage: 31.25,
      remainingHours: 27.5,
      estimatedCompletionDate: '2024-03-15',
      milestoneStatus: 'Quarter Complete'
    })

    setSessions([
      {
        id: '1',
        scheduledStart: '2024-02-01T10:00:00Z',
        scheduledEnd: '2024-02-01T11:00:00Z',
        status: 'COMPLETED',
        consultant: { firstName: 'Dr. Sarah', lastName: 'Johnson' }
      },
      {
        id: '2',
        scheduledStart: '2024-02-08T14:00:00Z',
        scheduledEnd: '2024-02-08T15:00:00Z',
        status: 'SCHEDULED',
        consultant: { firstName: 'Dr. Sarah', lastName: 'Johnson' }
      }
    ])

    setIsLoading(false)
  }, [])

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
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600">Track your EMDR consultation progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </Button>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.verifiedHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                of 40 hours completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.completionPercentage || 0}%</div>
              <Progress value={progress?.completionPercentage || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.remainingHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                hours to complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Milestone</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.milestoneStatus || 'Starting'}</div>
              <p className="text-xs text-muted-foreground">
                Current achievement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                {session.consultant.firstName[0]}{session.consultant.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {session.consultant.firstName} {session.consultant.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(session.scheduledStart).toLocaleDateString()} at{' '}
                                {new Date(session.scheduledStart).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Button size="sm">
                            <Video className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming sessions</p>
                      <Button className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest consultation activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Session completed</p>
                        <p className="text-xs text-gray-600">1 hour with Dr. Sarah Johnson</p>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs text-gray-600">Consultation log submitted</p>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Session scheduled</p>
                        <p className="text-xs text-gray-600">Next session with Dr. Sarah Johnson</p>
                      </div>
                      <span className="text-xs text-gray-500">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>
                  All your consultation sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Consultant</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          {new Date(session.scheduledStart).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {session.consultant.firstName} {session.consultant.lastName}
                        </TableCell>
                        <TableCell>1 hour</TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Center</CardTitle>
                <CardDescription>
                  Upload and manage your consultation documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                  <Button className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>
                  Track your journey to certification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Course Completed</p>
                      <p className="text-sm text-gray-600">You've completed the EMDR course</p>
                    </div>
                    <span className="text-sm text-gray-500">Jan 15, 2024</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">First Session</p>
                      <p className="text-sm text-gray-600">Completed your first consultation session</p>
                    </div>
                    <span className="text-sm text-gray-500">Feb 1, 2024</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">25%</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Quarter Complete</p>
                      <p className="text-sm text-gray-600">10 hours completed</p>
                    </div>
                    <span className="text-sm text-gray-500">In Progress</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">50%</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Halfway There</p>
                      <p className="text-sm text-gray-600">20 hours completed</p>
                    </div>
                    <span className="text-sm text-gray-500">Pending</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">75%</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Almost There</p>
                      <p className="text-sm text-gray-600">30 hours completed</p>
                    </div>
                    <span className="text-sm text-gray-500">Pending</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Certification Complete</p>
                      <p className="text-sm text-gray-600">40 hours completed - Certificate issued</p>
                    </div>
                    <span className="text-sm text-gray-500">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 