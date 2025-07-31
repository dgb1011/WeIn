import { db } from '../db'

// Type definitions for the admin service
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
  totalSessions?: number
  totalHours?: number
}

interface SystemHealthMetrics {
  status: SystemHealthStatus
  uptime: number
  activeUsers: number
  lastUpdated: Date
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
  userGrowth: UserGrowthData[]
}

interface UserGrowthData {
  date: string
  newUsers: number
  activeUsers: number
  totalUsers: number
}

interface SystemConfiguration {
  maintenanceMode: boolean
  registrationEnabled: boolean
  maxSessionsPerDay: number
  defaultSessionDuration: number
  autoApprovalEnabled: boolean
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
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
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
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      const total = await db.user.count({ where })

      // Enhance with basic data
      const enhancedUsers = users.map((user) => ({
        ...user,
        totalSessions: 0, // Mock data since we don't have session models
        totalHours: 0
      }))

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

      console.log(`User ${userId} status updated to ${status}. Reason: ${reason || 'No reason provided'}`)
    } catch (error) {
      console.error('Error updating user status:', error)
      throw new Error('Failed to update user status')
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      await db.user.delete({
        where: { id: userId }
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }

  // System Health
  static async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      const totalUsers = await db.user.count()
      const activeUsers = await db.user.count({ where: { status: 'ACTIVE' } })

      return {
        status: 'HEALTHY',
        uptime: 99.9,
        activeUsers,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error getting system health:', error)
      throw new Error('Failed to get system health')
    }
  }

  // System Analytics
  static async getSystemAnalytics(dateRange?: { start: Date; end: Date }): Promise<SystemAnalytics> {
    try {
      const totalUsers = await db.user.count()
      const activeUsers = await db.user.count({ where: { status: 'ACTIVE' } })

      // Mock user growth data
      const userGrowth: UserGrowthData[] = [
        {
          date: new Date().toISOString().split('T')[0],
          newUsers: 0,
          activeUsers,
          totalUsers
        }
      ]

      return {
        totalUsers,
        activeUsers,
        userGrowth
      }
    } catch (error) {
      console.error('Error getting system analytics:', error)
      throw new Error('Failed to get system analytics')
    }
  }

  // System Configuration
  static async getSystemConfiguration(): Promise<SystemConfiguration> {
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      maxSessionsPerDay: 10,
      defaultSessionDuration: 60,
      autoApprovalEnabled: true
    }
  }

  static async updateSystemConfiguration(updates: Partial<SystemConfiguration>): Promise<SystemConfiguration> {
    // Mock implementation - in a real app, this would save to database
    const currentConfig = await this.getSystemConfiguration()
    const updatedConfig = { ...currentConfig, ...updates }
    
    console.log('System configuration updated:', updatedConfig)
    return updatedConfig
  }
} 