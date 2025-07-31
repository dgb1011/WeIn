'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProgressOverview from '@/components/progress/ProgressOverview'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  BookOpen,
  Users,
  BarChart3
} from 'lucide-react'

interface ProgressStats {
  totalVerifiedHours: number
  completionPercentage: number
  remainingHours: number
  currentStreak: number
  estimatedCompletionDate: Date | null
  nextMilestone: any
}

export default function ProgressDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProgressStats()
  }, [])

  const loadProgressStats = async () => {
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
        setStats({
          totalVerifiedHours: data.progress.totalVerifiedHours,
          completionPercentage: data.progress.completionPercentage,
          remainingHours: data.progress.remainingHours,
          currentStreak: data.progress.currentStreak,
          estimatedCompletionDate: data.progress.estimatedCompletionDate,
          nextMilestone: data.progress.nextMilestone
        })
      } else {
        throw new Error('Failed to load progress stats')
      }
    } catch (error) {
      console.error('Error loading progress stats:', error)
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

  const handleBackToDashboard = () => {
    router.push('/dashboard/student')
  }

  const handleBookSession = () => {
    router.push('/scheduling')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadProgressStats} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Progress Dashboard</h1>
            <p className="text-gray-600">Track your EMDR consultation journey</p>
          </div>
        </div>
        
        <Button onClick={handleBookSession}>
          <BookOpen className="h-4 w-4 mr-2" />
          Book Session
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion</p>
                  <p className="text-2xl font-bold">{stats.completionPercentage.toFixed(1)}%</p>
                </div>
              </div>
              <Progress value={stats.completionPercentage} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours Completed</p>
                  <p className="text-2xl font-bold">{stats.totalVerifiedHours.toFixed(1)}h</p>
                  <p className="text-sm text-gray-500">{stats.remainingHours.toFixed(1)}h remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-sm text-gray-500">weeks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estimated Completion</p>
                  {stats.estimatedCompletionDate ? (
                    <p className="text-lg font-bold">{formatDate(stats.estimatedCompletionDate)}</p>
                  ) : (
                    <p className="text-lg font-bold text-gray-400">TBD</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Next Milestone Alert */}
      {stats?.nextMilestone && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Next Milestone</h3>
                  <p className="text-blue-800">
                    {stats.nextMilestone.description} - {stats.nextMilestone.hoursRemaining.toFixed(1)} hours remaining
                  </p>
                  <p className="text-sm text-blue-600">
                    Estimated: {formatDate(stats.nextMilestone.estimatedDate)}
                  </p>
                </div>
              </div>
              
              <Button variant="outline" onClick={handleBookSession}>
                Book Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Progress */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Weekly</span>
          </TabsTrigger>
          <TabsTrigger value="consultants" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Consultants</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProgressOverview />
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Milestone Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Weekly Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultants">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Consultant Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressOverview />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Book Next Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Continue your progress by booking your next consultation session with one of our EMDR specialists.
            </p>
            <Button onClick={handleBookSession} className="w-full">
              Schedule Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Set Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Set personal goals and track your progress towards completing your EMDR certification requirements.
            </p>
            <Button variant="outline" className="w-full">
              Manage Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 