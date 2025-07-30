import { db } from '../db'

// Type definitions for the service
type UserType = 'STUDENT' | 'CONSULTANT' | 'ADMIN'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type SystemHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE'

interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  status: UserStatus
  createdAt: Date
  lastLoginAt: Date | null
  totalSessions?: number
  totalHours?: number
}

interface SystemHealthMetrics {
  status: SystemHealthStatus
  uptime: number
  activeUsers: number
  activeSessions: number
  databaseConnections: number
  averageResponseTime: number
  errorRate: number
  lastUpdated: Date
  alerts: SystemAlert[]
}

interface SystemAlert {
  id: string
  type: 'ERROR' | 'WARNING' | 'INFO'
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

interface SystemAnalytics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  completedSessions: number
  totalHours: number
  averageSessionDuration: number
  userGrowth: UserGrowthData[]
  sessionTrends: SessionTrendData[]
  consultantPerformance: ConsultantPerformanceData[]
  systemUsage: SystemUsageData[]
}

interface UserGrowthData {
  date: string
  newUsers: number
  activeUsers: number
  totalUsers: number
}

interface SessionTrendData {
  date: string
  scheduledSessions: number
  completedSessions: number
  cancelledSessions: number
  averageDuration: number
}

interface ConsultantPerformanceData {
  consultantId: string
  consultantName: string
  totalSessions: number
  totalHours: number
  averageRating: number
  completionRate: number
  earnings: number
}

interface SystemUsageData {
  date: string
  pageViews: number
  uniqueVisitors: number
  averageSessionDuration: number
  bounceRate: number
}

interface SystemConfiguration {
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxSessionsPerDay: number
  defaultSessionDuration: number
  autoApprovalEnabled: boolean
  notificationSettings: NotificationSettings
  securitySettings: SecuritySettings
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  inAppNotifications: boolean
  reminderSettings: ReminderSettings
}

interface ReminderSettings {
  sessionReminderHours: number
  followUpReminderDays: number
  paymentReminderDays: number
}

interface SecuritySettings {
  passwordMinLength: number
  requireTwoFactor: boolean
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
}

export class AdminService {
  // User Management
  static async getAllUsers(options: {
    userType?: UserType[]
    status?: UserStatus[]
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<{ users: UserSummary[]; total: number; hasMore: boolean }> {
    try {
      const { userType, status, limit = 20, offset = 0, search } = options

      const where: any = {}
      
      if (userType && userType.length > 0) {
        where.userType = { in: userType }
      }

      if (status && status.length > 0) {
        where.status = { in: status }
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }

      const users = await db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          status: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      const total = await db.user.count({ where })

      // Enhance with session data for students and consultants
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          let totalSessions = 0
          let totalHours = 0

          if (user.userType === 'STUDENT') {
            const studentSessions = await db.consultationSession.findMany({
              where: { studentId: user.id },
              select: { id: true, scheduledStart: true, scheduledEnd: true, status: true }
            })
            totalSessions = studentSessions.length
            totalHours = studentSessions.reduce((total, session) => {
              if (session.status === 'COMPLETED') {
                const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
                return total + (duration / (1000 * 60 * 60))
              }
              return total
            }, 0)
          } else if (user.userType === 'CONSULTANT') {
            const consultantSessions = await db.consultationSession.findMany({
              where: { consultantId: user.id },
              select: { id: true, scheduledStart: true, scheduledEnd: true, status: true }
            })
            totalSessions = consultantSessions.length
            totalHours = consultantSessions.reduce((total, session) => {
              if (session.status === 'COMPLETED') {
                const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
                return total + (duration / (1000 * 60 * 60))
              }
              return total
            }, 0)
          }

          return {
            ...user,
            totalSessions,
            totalHours
          }
        })
      )

      return {
        users: enhancedUsers,
        total,
        hasMore: offset + limit < total
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }
  }

  static async updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<void> {
    try {
      await db.user.update({
        where: { id: userId },
        data: { 
          status,
          updatedAt: new Date()
        }
      })

      // Log the status change
      await db.systemAuditLog.create({
        data: {
          action: 'USER_STATUS_UPDATE',
          userId,
          details: {
            newStatus: status,
            reason: reason || 'No reason provided'
          },
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating user status:', error)
      throw new Error('Failed to update user status')
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      // Soft delete by setting status to INACTIVE
      await db.user.update({
        where: { id: userId },
        data: { 
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      })

      // Log the deletion
      await db.systemAuditLog.create({
        data: {
          action: 'USER_DELETE',
          userId,
          details: { softDelete: true },
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }

  // System Health Monitoring
  static async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      // Get basic system metrics
      const totalUsers = await db.user.count()
      const activeUsers = await db.user.count({ where: { status: 'ACTIVE' } })
      
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      const activeSessions = await db.consultationSession.count({
        where: {
          scheduledStart: { gte: startOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
        }
      })

      // Get recent alerts
      const alerts = await db.systemAlert.findMany({
        where: { resolved: false },
        orderBy: { timestamp: 'desc' },
        take: 10
      })

      // Calculate system status based on metrics
      let status: SystemHealthStatus = 'HEALTHY'
      if (alerts.some(alert => alert.severity === 'CRITICAL')) {
        status = 'CRITICAL'
      } else if (alerts.some(alert => alert.severity === 'HIGH')) {
        status = 'WARNING'
      }

      // Mock metrics for now (in production, these would come from monitoring tools)
      const metrics = {
        status,
        uptime: 99.9,
        activeUsers,
        activeSessions,
        databaseConnections: 15,
        averageResponseTime: 250,
        errorRate: 0.1,
        lastUpdated: new Date(),
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.type as 'ERROR' | 'WARNING' | 'INFO',
          message: alert.message,
          severity: alert.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          resolvedAt: alert.resolvedAt || undefined
        }))
      }

      return metrics
    } catch (error) {
      console.error('Error fetching system health:', error)
      throw new Error('Failed to fetch system health')
    }
  }

  static async createSystemAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'resolved'>): Promise<SystemAlert> {
    try {
      const newAlert = await db.systemAlert.create({
        data: {
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
          timestamp: new Date(),
          resolved: false
        }
      })

      return {
        id: newAlert.id,
        type: newAlert.type as 'ERROR' | 'WARNING' | 'INFO',
        message: newAlert.message,
        severity: newAlert.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        timestamp: newAlert.timestamp,
        resolved: newAlert.resolved,
        resolvedAt: newAlert.resolvedAt || undefined
      }
    } catch (error) {
      console.error('Error creating system alert:', error)
      throw new Error('Failed to create system alert')
    }
  }

  static async resolveSystemAlert(alertId: string): Promise<void> {
    try {
      await db.systemAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error resolving system alert:', error)
      throw new Error('Failed to resolve system alert')
    }
  }

  // Analytics and Reporting
  static async getSystemAnalytics(dateRange?: { start: Date; end: Date }): Promise<SystemAnalytics> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default to last 30 days
      const endDate = dateRange?.end || new Date()

      // Basic counts
      const totalUsers = await db.user.count()
      const activeUsers = await db.user.count({ where: { status: 'ACTIVE' } })
      const totalSessions = await db.consultationSession.count({
        where: { scheduledStart: { gte: startDate, lte: endDate } }
      })
      const completedSessions = await db.consultationSession.count({
        where: {
          scheduledStart: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        }
      })

      // Calculate total hours
      const sessions = await db.consultationSession.findMany({
        where: {
          scheduledStart: { gte: startDate, lte: endDate },
          status: 'COMPLETED'
        },
        select: { scheduledStart: true, scheduledEnd: true }
      })

      const totalHours = sessions.reduce((total, session) => {
        const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
        return total + (duration / (1000 * 60 * 60))
      }, 0)

      const averageSessionDuration = sessions.length > 0 ? totalHours / sessions.length : 0

      // User growth data
      const userGrowth = await this.calculateUserGrowth(startDate, endDate)

      // Session trends
      const sessionTrends = await this.calculateSessionTrends(startDate, endDate)

      // Consultant performance
      const consultantPerformance = await this.calculateConsultantPerformance(startDate, endDate)

      // System usage (mock data for now)
      const systemUsage = this.generateMockSystemUsage(startDate, endDate)

      return {
        totalUsers,
        activeUsers,
        totalSessions,
        completedSessions,
        totalHours,
        averageSessionDuration,
        userGrowth,
        sessionTrends,
        consultantPerformance,
        systemUsage
      }
    } catch (error) {
      console.error('Error fetching system analytics:', error)
      throw new Error('Failed to fetch system analytics')
    }
  }

  // Configuration Management
  static async getSystemConfiguration(): Promise<SystemConfiguration> {
    try {
      const config = await db.systemConfiguration.findFirst()
      
      if (!config) {
        // Return default configuration
        return {
          maintenanceMode: false,
          registrationEnabled: true,
          maxSessionsPerDay: 8,
          defaultSessionDuration: 60,
          autoApprovalEnabled: true,
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            inAppNotifications: true,
            reminderSettings: {
              sessionReminderHours: 24,
              followUpReminderDays: 7,
              paymentReminderDays: 14
            }
          },
          securitySettings: {
            passwordMinLength: 8,
            requireTwoFactor: false,
            sessionTimeoutMinutes: 60,
            maxLoginAttempts: 5
          }
        }
      }

      return {
        maintenanceMode: config.maintenanceMode,
        registrationEnabled: config.registrationEnabled,
        maxSessionsPerDay: config.maxSessionsPerDay,
        defaultSessionDuration: config.defaultSessionDuration,
        autoApprovalEnabled: config.autoApprovalEnabled,
        notificationSettings: config.notificationSettings as NotificationSettings,
        securitySettings: config.securitySettings as SecuritySettings
      }
    } catch (error) {
      console.error('Error fetching system configuration:', error)
      throw new Error('Failed to fetch system configuration')
    }
  }

  static async updateSystemConfiguration(updates: Partial<SystemConfiguration>): Promise<SystemConfiguration> {
    try {
      const existingConfig = await db.systemConfiguration.findFirst()
      
      if (existingConfig) {
        await db.systemConfiguration.update({
          where: { id: existingConfig.id },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        })
      } else {
        await db.systemConfiguration.create({
          data: {
            ...updates,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return await this.getSystemConfiguration()
    } catch (error) {
      console.error('Error updating system configuration:', error)
      throw new Error('Failed to update system configuration')
    }
  }

  // Helper methods
  private static async calculateUserGrowth(startDate: Date, endDate: Date): Promise<UserGrowthData[]> {
    const growthData: UserGrowthData[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const newUsers = await db.user.count({
        where: {
          createdAt: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
          }
        }
      })

      const totalUsers = await db.user.count({
        where: {
          createdAt: { lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1) }
        }
      })

      const activeUsers = await db.user.count({
        where: {
          status: 'ACTIVE',
          lastLoginAt: {
            gte: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
          }
        }
      })

      growthData.push({
        date: dateStr,
        newUsers,
        activeUsers,
        totalUsers
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return growthData
  }

  private static async calculateSessionTrends(startDate: Date, endDate: Date): Promise<SessionTrendData[]> {
    const trendsData: SessionTrendData[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const scheduledSessions = await db.consultationSession.count({
        where: {
          scheduledStart: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
          }
        }
      })

      const completedSessions = await db.consultationSession.count({
        where: {
          scheduledStart: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
          },
          status: 'COMPLETED'
        }
      })

      const cancelledSessions = await db.consultationSession.count({
        where: {
          scheduledStart: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
          },
          status: 'CANCELLED'
        }
      })

      // Calculate average duration for completed sessions
      const sessions = await db.consultationSession.findMany({
        where: {
          scheduledStart: {
            gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
            lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
          },
          status: 'COMPLETED'
        },
        select: { scheduledStart: true, scheduledEnd: true }
      })

      const totalDuration = sessions.reduce((total, session) => {
        const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
        return total + (duration / (1000 * 60 * 60))
      }, 0)

      const averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0

      trendsData.push({
        date: dateStr,
        scheduledSessions,
        completedSessions,
        cancelledSessions,
        averageDuration
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return trendsData
  }

  private static async calculateConsultantPerformance(startDate: Date, endDate: Date): Promise<ConsultantPerformanceData[]> {
    const consultants = await db.consultant.findMany({
      include: {
        user: true
      }
    })

    const performanceData = await Promise.all(
      consultants.map(async (consultant) => {
        const sessions = await db.consultationSession.findMany({
          where: {
            consultantId: consultant.id,
            scheduledStart: { gte: startDate, lte: endDate }
          }
        })

        const completedSessions = sessions.filter(s => s.status === 'COMPLETED')
        const totalSessions = sessions.length
        const completionRate = totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0

        const totalHours = completedSessions.reduce((total, session) => {
          const duration = new Date(session.scheduledEnd).getTime() - new Date(session.scheduledStart).getTime()
          return total + (duration / (1000 * 60 * 60))
        }, 0)

        const earnings = totalHours * (consultant.hourlyRate || 0)

        // Mock average rating (in production, this would come from ratings table)
        const averageRating = 4.5

        return {
          consultantId: consultant.id,
          consultantName: `${consultant.user.firstName} ${consultant.user.lastName}`,
          totalSessions,
          totalHours,
          averageRating,
          completionRate,
          earnings
        }
      })
    )

    return performanceData.sort((a, b) => b.earnings - a.earnings)
  }

  private static generateMockSystemUsage(startDate: Date, endDate: Date): SystemUsageData[] {
    const usageData: SystemUsageData[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // Mock data - in production, this would come from analytics tools
      usageData.push({
        date: dateStr,
        pageViews: Math.floor(Math.random() * 1000) + 100,
        uniqueVisitors: Math.floor(Math.random() * 200) + 50,
        averageSessionDuration: Math.floor(Math.random() * 30) + 5,
        bounceRate: Math.random() * 0.5 + 0.1
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return usageData
  }
} 