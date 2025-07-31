import { db } from '../db'
import { User, UserType, SessionStatus } from '@prisma/client'

export interface NotificationTemplate {
  id: string
  type: NotificationType
  subject: string
  body: string
  smsBody?: string
  variables: string[]
}

export interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  priority: NotificationPriority
  expiresAt?: Date
}

export interface EmailNotification {
  to: string
  subject: string
  html: string
  text: string
}

export interface SMSNotification {
  to: string
  message: string
}

export interface InAppNotification {
  userId: string
  title: string
  message: string
  type: NotificationType
  data?: Record<string, any>
  read: boolean
  createdAt: Date
}

export enum NotificationType {
  // Session related
  SESSION_SCHEDULED = 'SESSION_SCHEDULED',
  SESSION_REMINDER_24H = 'SESSION_REMINDER_24H',
  SESSION_REMINDER_2H = 'SESSION_REMINDER_2H',
  SESSION_REMINDER_15M = 'SESSION_REMINDER_15M',
  SESSION_CANCELLED = 'SESSION_CANCELLED',
  SESSION_RESCHEDULED = 'SESSION_RESCHEDULED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  
  // Progress related
  MILESTONE_REACHED = 'MILESTONE_REACHED',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  CERTIFICATION_ELIGIBLE = 'CERTIFICATION_ELIGIBLE',
  CERTIFICATION_COMPLETED = 'CERTIFICATION_COMPLETED',
  
  // Document related
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_REVIEW_REQUIRED = 'DOCUMENT_REVIEW_REQUIRED',
  
  // System related
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  SECURITY_ALERT = 'SECURITY_ALERT',
  
  // Consultant related
  NEW_BOOKING = 'NEW_BOOKING',
  SESSION_VERIFICATION_REQUIRED = 'SESSION_VERIFICATION_REQUIRED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  
  // Admin related
  USER_REGISTRATION = 'USER_REGISTRATION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
  PUSH = 'PUSH'
}

export interface UserNotificationPreferences {
  userId: string
  emailEnabled: boolean
  smsEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean
  quietHours: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    timezone: string
  }
  notificationTypes: {
    [key in NotificationType]: {
      email: boolean
      sms: boolean
      inApp: boolean
      push: boolean
    }
  }
}

class NotificationService {
  private templates: Map<NotificationType, NotificationTemplate> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  private initializeTemplates() {
    // Session Templates
    this.templates.set(NotificationType.SESSION_SCHEDULED, {
      id: 'session_scheduled',
      type: NotificationType.SESSION_SCHEDULED,
      subject: 'Consultation Session Scheduled',
      body: `
        <h2>Your consultation session has been scheduled!</h2>
        <p>Hello {{firstName}},</p>
        <p>Your consultation session with {{consultantName}} has been scheduled for:</p>
        <ul>
          <li><strong>Date:</strong> {{sessionDate}}</li>
          <li><strong>Time:</strong> {{sessionTime}}</li>
          <li><strong>Duration:</strong> {{duration}} minutes</li>
        </ul>
        <p>You can join the session 5 minutes before the scheduled time.</p>
        <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
      `,
      smsBody: 'Your consultation session with {{consultantName}} is scheduled for {{sessionDate}} at {{sessionTime}}. Join 5 min early.',
      variables: ['firstName', 'consultantName', 'sessionDate', 'sessionTime', 'duration']
    })

    this.templates.set(NotificationType.SESSION_REMINDER_24H, {
      id: 'session_reminder_24h',
      type: NotificationType.SESSION_REMINDER_24H,
      subject: 'Reminder: Consultation Session Tomorrow',
      body: `
        <h2>Reminder: Your consultation session is tomorrow</h2>
        <p>Hello {{firstName}},</p>
        <p>This is a friendly reminder that your consultation session is scheduled for tomorrow:</p>
        <ul>
          <li><strong>Date:</strong> {{sessionDate}}</li>
          <li><strong>Time:</strong> {{sessionTime}}</li>
          <li><strong>Consultant:</strong> {{consultantName}}</li>
        </ul>
        <p>Please ensure you have a stable internet connection and are in a quiet environment.</p>
      `,
      smsBody: 'Reminder: Your consultation session with {{consultantName}} is tomorrow at {{sessionTime}}.',
      variables: ['firstName', 'consultantName', 'sessionDate', 'sessionTime']
    })

    this.templates.set(NotificationType.SESSION_REMINDER_2H, {
      id: 'session_reminder_2h',
      type: NotificationType.SESSION_REMINDER_2H,
      subject: 'Reminder: Consultation Session in 2 Hours',
      body: `
        <h2>Your consultation session starts in 2 hours</h2>
        <p>Hello {{firstName}},</p>
        <p>Your consultation session with {{consultantName}} starts in 2 hours at {{sessionTime}}.</p>
        <p>Please prepare your environment and ensure you're ready for the session.</p>
      `,
      smsBody: 'Your consultation session with {{consultantName}} starts in 2 hours at {{sessionTime}}.',
      variables: ['firstName', 'consultantName', 'sessionTime']
    })

    this.templates.set(NotificationType.SESSION_REMINDER_15M, {
      id: 'session_reminder_15m',
      type: NotificationType.SESSION_REMINDER_15M,
      subject: 'Your consultation session starts in 15 minutes',
      body: `
        <h2>Session starting soon!</h2>
        <p>Hello {{firstName}},</p>
        <p>Your consultation session with {{consultantName}} starts in 15 minutes.</p>
        <p>You can now join the session room.</p>
      `,
      smsBody: 'Your consultation session with {{consultantName}} starts in 15 minutes. Join now.',
      variables: ['firstName', 'consultantName']
    })

    // Progress Templates
    this.templates.set(NotificationType.MILESTONE_REACHED, {
      id: 'milestone_reached',
      type: NotificationType.MILESTONE_REACHED,
      subject: 'Congratulations! You\'ve reached a milestone',
      body: `
        <h2>🎉 Milestone Achieved!</h2>
        <p>Hello {{firstName}},</p>
        <p>Congratulations! You've reached {{milestoneName}} with {{hoursCompleted}} hours completed.</p>
        <p>You're making excellent progress toward your certification!</p>
      `,
      smsBody: '🎉 Congratulations! You\'ve reached {{milestoneName}} with {{hoursCompleted}} hours completed.',
      variables: ['firstName', 'milestoneName', 'hoursCompleted']
    })

    this.templates.set(NotificationType.CERTIFICATION_ELIGIBLE, {
      id: 'certification_eligible',
      type: NotificationType.CERTIFICATION_ELIGIBLE,
      subject: 'You\'re eligible for certification!',
      body: `
        <h2>🎓 Certification Eligibility</h2>
        <p>Hello {{firstName}},</p>
        <p>Great news! You've completed all requirements and are now eligible for certification.</p>
        <p>Your certificate will be generated and sent to you within 24 hours.</p>
      `,
      smsBody: '🎓 Great news! You\'re eligible for certification. Your certificate will be sent within 24 hours.',
      variables: ['firstName']
    })

    // Document Templates
    this.templates.set(NotificationType.DOCUMENT_APPROVED, {
      id: 'document_approved',
      type: NotificationType.DOCUMENT_APPROVED,
      subject: 'Document Approved',
      body: `
        <h2>Document Approved</h2>
        <p>Hello {{firstName}},</p>
        <p>Your document "{{documentName}}" has been approved.</p>
        <p>This brings you one step closer to certification!</p>
      `,
      smsBody: 'Your document "{{documentName}}" has been approved.',
      variables: ['firstName', 'documentName']
    })

    this.templates.set(NotificationType.DOCUMENT_REJECTED, {
      id: 'document_rejected',
      type: NotificationType.DOCUMENT_REJECTED,
      subject: 'Document Review Required',
      body: `
        <h2>Document Review Required</h2>
        <p>Hello {{firstName}},</p>
        <p>Your document "{{documentName}}" requires revisions.</p>
        <p><strong>Feedback:</strong> {{feedback}}</p>
        <p>Please review and resubmit the document.</p>
      `,
      smsBody: 'Your document "{{documentName}}" requires revisions. Check your email for details.',
      variables: ['firstName', 'documentName', 'feedback']
    })

    // Consultant Templates
    this.templates.set(NotificationType.NEW_BOOKING, {
      id: 'new_booking',
      type: NotificationType.NEW_BOOKING,
      subject: 'New Session Booking',
      body: `
        <h2>New Session Booking</h2>
        <p>Hello {{consultantName}},</p>
        <p>You have a new consultation session booked:</p>
        <ul>
          <li><strong>Student:</strong> {{studentName}}</li>
          <li><strong>Date:</strong> {{sessionDate}}</li>
          <li><strong>Time:</strong> {{sessionTime}}</li>
          <li><strong>Duration:</strong> {{duration}} minutes</li>
        </ul>
      `,
      smsBody: 'New booking: {{studentName}} on {{sessionDate}} at {{sessionTime}}.',
      variables: ['consultantName', 'studentName', 'sessionDate', 'sessionTime', 'duration']
    })

    this.templates.set(NotificationType.SESSION_VERIFICATION_REQUIRED, {
      id: 'session_verification_required',
      type: NotificationType.SESSION_VERIFICATION_REQUIRED,
      subject: 'Session Verification Required',
      body: `
        <h2>Session Verification Required</h2>
        <p>Hello {{consultantName}},</p>
        <p>Please verify your recent session with {{studentName}} on {{sessionDate}}.</p>
        <p>This helps ensure accurate progress tracking and payment processing.</p>
      `,
      smsBody: 'Please verify your session with {{studentName}} on {{sessionDate}}.',
      variables: ['consultantName', 'studentName', 'sessionDate']
    })
  }

  async sendNotification(notificationData: NotificationData): Promise<void> {
    try {
      // Get user and their preferences
      const user = await db.user.findUnique({
        where: { id: notificationData.userId },
        include: {
          student: true,
          consultant: true,
          admin: true
        }
      })

      if (!user) {
        throw new Error(`User not found: ${notificationData.userId}`)
      }

      // Get user notification preferences
      const preferences = await this.getUserNotificationPreferences(notificationData.userId)

      // Check if we're in quiet hours
      if (this.isInQuietHours(preferences)) {
        console.log(`Skipping notification during quiet hours for user ${notificationData.userId}`)
        return
      }

      // Send notifications based on preferences
      const promises: Promise<void>[] = []

      if (preferences.emailEnabled && this.shouldSendEmail(notificationData.type, preferences)) {
        promises.push(this.sendEmailNotification(user, notificationData))
      }

      if (preferences.smsEnabled && this.shouldSendSMS(notificationData.type, preferences)) {
        promises.push(this.sendSMSNotification(user, notificationData))
      }

      if (preferences.inAppEnabled && this.shouldSendInApp(notificationData.type, preferences)) {
        promises.push(this.createInAppNotification(notificationData))
      }

      // Wait for all notifications to be sent
      await Promise.all(promises)

      // Log the notification
      await this.logNotification(notificationData)

    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]): Promise<void> {
    const promises = notifications.map(notification => this.sendNotification(notification))
    await Promise.all(promises)
  }

  async scheduleNotification(notificationData: NotificationData, scheduledFor: Date): Promise<void> {
    // Store the notification to be sent at the scheduled time
    await db.scheduledNotification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        priority: notificationData.priority,
        scheduledFor,
        status: 'PENDING'
      }
    })
  }

  async sendSessionNotifications(sessionId: string): Promise<void> {
    const session = await db.consultationSession.findUnique({
      where: { id: sessionId },
      include: {
        student: { include: { user: true } },
        consultant: { include: { user: true } }
      }
    })

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const sessionDate = new Date(session.scheduledStart)
    const sessionTime = sessionDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'UTC'
    })

    // Send immediate confirmation to student
    await this.sendNotification({
      userId: session.student.user.id,
      type: NotificationType.SESSION_SCHEDULED,
      title: 'Session Scheduled',
      message: `Your consultation session with ${session.consultant.user.firstName} ${session.consultant.user.lastName} has been scheduled for ${sessionDate.toLocaleDateString()} at ${sessionTime}.`,
      data: {
        sessionId: session.id,
        consultantName: `${session.consultant.user.firstName} ${session.consultant.user.lastName}`,
        sessionDate: sessionDate.toLocaleDateString(),
        sessionTime,
        duration: Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60))
      },
      priority: NotificationPriority.NORMAL
    })

    // Send notification to consultant
    await this.sendNotification({
      userId: session.consultant.user.id,
      type: NotificationType.NEW_BOOKING,
      title: 'New Session Booking',
      message: `New consultation session booked with ${session.student.user.firstName} ${session.student.user.lastName} on ${sessionDate.toLocaleDateString()} at ${sessionTime}.`,
      data: {
        sessionId: session.id,
        studentName: `${session.student.user.firstName} ${session.student.user.lastName}`,
        sessionDate: sessionDate.toLocaleDateString(),
        sessionTime,
        duration: Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / (1000 * 60))
      },
      priority: NotificationPriority.NORMAL
    })

    // Schedule reminder notifications
    const reminderTimes = [
      { hours: 24, type: NotificationType.SESSION_REMINDER_24H },
      { hours: 2, type: NotificationType.SESSION_REMINDER_2H },
      { minutes: 15, type: NotificationType.SESSION_REMINDER_15M }
    ]

    for (const reminder of reminderTimes) {
      const reminderTime = new Date(session.scheduledStart)
      if (reminder.hours) {
        reminderTime.setHours(reminderTime.getHours() - reminder.hours)
      } else if (reminder.minutes) {
        reminderTime.setMinutes(reminderTime.getMinutes() - reminder.minutes)
      }

      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        await this.scheduleNotification({
          userId: session.student.user.id,
          type: reminder.type,
          title: 'Session Reminder',
          message: `Your consultation session starts ${reminder.hours ? `in ${reminder.hours} hours` : 'in 15 minutes'}.`,
          data: { sessionId: session.id },
          priority: NotificationPriority.HIGH
        }, reminderTime)
      }
    }
  }

  async sendMilestoneNotification(userId: string, milestoneName: string, hoursCompleted: number): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Milestone Achieved!',
      message: `Congratulations! You've reached ${milestoneName} with ${hoursCompleted} hours completed.`,
      data: { milestoneName, hoursCompleted },
      priority: NotificationPriority.NORMAL
    })
  }

  async sendCertificationEligibleNotification(userId: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.CERTIFICATION_ELIGIBLE,
      title: 'Certification Eligible!',
      message: 'Great news! You\'ve completed all requirements and are now eligible for certification.',
      data: {},
      priority: NotificationPriority.HIGH
    })
  }

  async sendDocumentNotification(userId: string, documentName: string, status: 'approved' | 'rejected', feedback?: string): Promise<void> {
    const type = status === 'approved' ? NotificationType.DOCUMENT_APPROVED : NotificationType.DOCUMENT_REJECTED
    
    await this.sendNotification({
      userId,
      type,
      title: `Document ${status === 'approved' ? 'Approved' : 'Review Required'}`,
      message: status === 'approved' 
        ? `Your document "${documentName}" has been approved.`
        : `Your document "${documentName}" requires revisions.`,
      data: { documentName, feedback },
      priority: NotificationPriority.NORMAL
    })
  }

  private async sendEmailNotification(user: any, notificationData: NotificationData): Promise<void> {
    const template = this.templates.get(notificationData.type)
    
    if (!template) {
      console.warn(`No email template found for notification type: ${notificationData.type}`)
      return
    }

    const emailBody = this.processTemplate(template, notificationData.data || {})
    const emailSubject = template.subject
    
    // In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.
    console.log('Sending email notification:', {
      to: user.email,
      subject: emailSubject,
      body: emailBody
    })

    // For now, we'll just log the email
    // TODO: Integrate with actual email service
  }

  private async sendSMSNotification(user: any, notificationData: NotificationData): Promise<void> {
    const template = this.templates.get(notificationData.type)
    
    if (!template?.smsBody) {
      console.warn(`No SMS template found for notification type: ${notificationData.type}`)
      return
    }

    const smsMessage = this.processTemplate(template, notificationData.data || {}, 'smsBody')
    
    // In a real implementation, you would integrate with an SMS service like Twilio, AWS SNS, etc.
    console.log('Sending SMS notification:', {
      to: user.phone,
      message: smsMessage
    })

    // For now, we'll just log the SMS
    // TODO: Integrate with actual SMS service
  }

  private async createInAppNotification(notificationData: NotificationData): Promise<void> {
    await db.inAppNotification.create({
      data: {
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data,
        read: false
      }
    })
  }

  private async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
    // Get user preferences from database
    const preferences = await db.userNotificationPreferences.findUnique({
      where: { userId }
    })

    if (preferences) {
      return {
        userId: preferences.userId,
        emailEnabled: preferences.emailEnabled,
        smsEnabled: preferences.smsEnabled,
        inAppEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
        quietHours: preferences.quietHours as UserNotificationPreferences['quietHours'],
        notificationTypes: preferences.notificationTypes as UserNotificationPreferences['notificationTypes']
      }
    }

    // Return default preferences if none exist
    return {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      pushEnabled: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      },
      notificationTypes: this.getDefaultNotificationTypes()
    }
  }

  private getDefaultNotificationTypes(): UserNotificationPreferences['notificationTypes'] {
    const types = {} as UserNotificationPreferences['notificationTypes']
    
    Object.values(NotificationType).forEach(type => {
      types[type] = {
        email: true,
        sms: false,
        inApp: true,
        push: false
      }
    })

    return types
  }

  private isInQuietHours(preferences: UserNotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) {
      return false
    }

    const now = new Date()
    const userTimezone = preferences.quietHours.timezone || 'UTC'
    
    // Convert current time to user's timezone
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }))
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes()
    
    const startTime = this.parseTimeString(preferences.quietHours.startTime)
    const endTime = this.parseTimeString(preferences.quietHours.endTime)
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime
    }
  }

  private parseTimeString(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  private shouldSendEmail(type: NotificationType, preferences: UserNotificationPreferences): boolean {
    return preferences.notificationTypes[type]?.email ?? true
  }

  private shouldSendSMS(type: NotificationType, preferences: UserNotificationPreferences): boolean {
    return preferences.notificationTypes[type]?.sms ?? false
  }

  private shouldSendInApp(type: NotificationType, preferences: UserNotificationPreferences): boolean {
    return preferences.notificationTypes[type]?.inApp ?? true
  }

  private processTemplate(template: NotificationTemplate, data: Record<string, any>, field: 'body' | 'smsBody' = 'body'): string {
    let content = template[field] || template.body
    
    // Replace variables in the template
    template.variables.forEach(variable => {
      const value = data[variable] || `{{${variable}}}`
      const regex = new RegExp(`{{${variable}}}`, 'g')
      content = content.replace(regex, value)
    })
    
    return content
  }

  private async logNotification(notificationData: NotificationData): Promise<void> {
    await db.notificationLog.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        priority: notificationData.priority,
        sentAt: new Date()
      }
    })
  }

  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<InAppNotification[]> {
    const notifications = await db.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return notifications.map(notification => ({
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType,
      data: notification.data as Record<string, any>,
      read: notification.read,
      createdAt: notification.createdAt
    }))
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db.inAppNotification.update({
      where: { id: notificationId },
      data: { read: true }
    })
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.inAppNotification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return await db.inAppNotification.count({
      where: { userId, read: false }
    })
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<void> {
    await db.userNotificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences
      }
    })
  }
}

export const notificationService = new NotificationService() 