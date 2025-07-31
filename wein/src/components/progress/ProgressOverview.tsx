'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar, 
  Award, 
  Users, 
  BarChart3,
  Trophy,
  Star,
  CheckCircle,
  Circle
} from 'lucide-react'

interface ProgressData {
  totalVerifiedHours: number
  totalPendingHours: number
  totalProjectedHours: number
  completionPercentage: number
  remainingHours: number
  estimatedCompletionDate: Date | null
  weeklyProgress: WeeklyProgress[]
  milestoneStatus: MilestoneStatus[]
  consultantDistribution: ConsultantDistribution[]
  currentStreak: number
  averageSessionLength: number
  lastSessionDate: Date | null
  nextMilestone: MilestoneInfo | null
}

interface WeeklyProgress {
  weekStart: Date
  weekEnd: Date
  hoursCompleted: number
  sessionsCompleted: number
  averageRating: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface MilestoneStatus {
  type: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MILESTONE_REACHED' | 'COMPLETED'
  achievedAt: Date | null
  description: string
  icon: string
  color: string
}

interface MilestoneInfo {
  type: string
  description: string
  hoursRequired: number
  hoursRemaining: number
  estimatedDate: Date
  icon: string
  color: string
}

interface ConsultantDistribution {
  consultantId: string
  consultantName: string
  sessionsCount: number
  totalHours: number
  averageRating: number
  lastSessionDate: Date
  percentage: number
}

export default function ProgressOverview() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/progress?action=overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProgressData(data.progress)
      } else {
        throw new Error('Failed to load progress data')
      }
    } catch (error) {
      console.error('Error loading progress data:', error)
      setError('Failed to load progress data')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'MILESTONE_REACHED':
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Circle className="h-5 w-5 text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading progress...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadProgressData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600">No progress data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Completion</h3>
                <Badge variant="default">
                  {progressData.completionPercentage.toFixed(1)}%
                </Badge>
              </div>
              
              <Progress value={progressData.completionPercentage} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Completed</p>
                  <p className="font-semibold">{progressData.totalVerifiedHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-gray-600">Remaining</p>
                  <p className="font-semibold">{progressData.remainingHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>

            {/* Estimated Completion */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Estimated Completion</h3>
              </div>
              
              {progressData.estimatedCompletionDate ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatDate(progressData.estimatedCompletionDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Based on your current pace
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">Complete your first session to get an estimate</p>
              )}
            </div>

            {/* Current Streak */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Current Streak</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-bold text-orange-600">
                  {progressData.currentStreak} weeks
                </p>
                <p className="text-sm text-gray-600">
                  Consistent weekly sessions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Progress Tabs */}
      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
          <TabsTrigger value="consultants">Consultants</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Achievement Milestones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.milestoneStatus.map((milestone, index) => (
                  <div key={milestone.type} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getMilestoneIcon(milestone.status)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{milestone.icon}</span>
                        <h4 className="font-semibold">{milestone.description}</h4>
                        <Badge 
                          variant={
                            milestone.status === 'MILESTONE_REACHED' ? 'default' :
                            milestone.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                          }
                        >
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      {milestone.achievedAt && (
                        <p className="text-sm text-gray-600 mt-1">
                          Achieved on {formatDate(milestone.achievedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Milestone */}
              {progressData.nextMilestone && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Next Milestone</h4>
                  </div>
                  <p className="text-blue-800 mb-2">
                    {progressData.nextMilestone.description} - {progressData.nextMilestone.hoursRemaining.toFixed(1)} hours remaining
                  </p>
                  <p className="text-sm text-blue-600">
                    Estimated: {formatDate(progressData.nextMilestone.estimatedDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Progress Tab */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Weekly Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold">
                          {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {week.sessionsCompleted} sessions
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">{week.hoursCompleted.toFixed(1)}h</p>
                        <p className="text-sm text-gray-600">completed</p>
                      </div>
                      
                      {week.averageRating > 0 && (
                        <div className="text-right">
                          <p className="font-semibold">{week.averageRating.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">rating</p>
                        </div>
                      )}
                      
                      {getTrendIcon(week.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consultants Tab */}
        <TabsContent value="consultants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Consultant Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.consultantDistribution.map((consultant) => (
                  <div key={consultant.consultantId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">{consultant.consultantName}</h4>
                        <p className="text-sm text-gray-600">
                          {consultant.sessionsCount} sessions • {consultant.totalHours.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{consultant.percentage.toFixed(1)}%</p>
                      {consultant.averageRating > 0 && (
                        <p className="text-sm text-gray-600">
                          ⭐ {consultant.averageRating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Progress Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Session Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Session Length</span>
                      <span className="font-semibold">{formatTime(progressData.averageSessionLength)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sessions</span>
                      <span className="font-semibold">{progressData.consultantDistribution.reduce((sum, c) => sum + c.sessionsCount, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consultants Worked With</span>
                      <span className="font-semibold">{progressData.consultantDistribution.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Progress Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Current Streak</span>
                      <span className="font-semibold">{progressData.currentStreak} weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-semibold">{progressData.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours Remaining</span>
                      <span className="font-semibold">{progressData.remainingHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 