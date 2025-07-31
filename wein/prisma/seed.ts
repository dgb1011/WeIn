const { PrismaClient, UserType, StudentStatus, SessionStatus, DocumentType: PrismaDocumentType, ReviewStatus, PaymentStatus } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.systemHealthMetric.deleteMany()
  await prisma.consultantPayment.deleteMany()
  await prisma.sessionHistory.deleteMany()
  await prisma.studentDocument.deleteMany()
  await prisma.videoParticipant.deleteMany()
  await prisma.videoSession.deleteMany()
  await prisma.consultationSession.deleteMany()
  await prisma.consultantAvailability.deleteMany()
  await prisma.consultant.deleteMany()
  await prisma.student.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@brainbasedemdr.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      userType: UserType.ADMIN,
      status: 'ACTIVE',
      admin: {
        create: {
          role: 'super_admin',
          permissions: ['manage_users', 'manage_system', 'view_analytics']
        }
      }
    }
  })

  // Create consultant users
  const consultantPassword = await bcrypt.hash('consultant123', 12)
  const consultant1 = await prisma.user.create({
    data: {
      email: 'dr.sarah@brainbasedemdr.com',
      password: consultantPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      userType: UserType.CONSULTANT,
      status: 'ACTIVE',
      consultant: {
        create: {
          bio: 'Licensed EMDR therapist with 10+ years of experience specializing in trauma treatment.',
          specialties: ['Trauma', 'PTSD', 'Anxiety', 'Depression'],
          hourlyRate: 175.00,
          timezone: 'America/New_York'
        }
      }
    }
  })

  const consultant2 = await prisma.user.create({
    data: {
      email: 'dr.michael@brainbasedemdr.com',
      password: consultantPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      userType: UserType.CONSULTANT,
      status: 'ACTIVE',
      consultant: {
        create: {
          bio: 'EMDR consultant with expertise in complex trauma and dissociative disorders.',
          specialties: ['Complex Trauma', 'Dissociative Disorders', 'Attachment Issues'],
          hourlyRate: 200.00,
          timezone: 'America/Los_Angeles'
        }
      }
    }
  })

  // Create student users
  const studentPassword = await bcrypt.hash('student123', 12)
  const student1 = await prisma.user.create({
    data: {
      email: 'emma.wilson@example.com',
      password: studentPassword,
      firstName: 'Emma',
      lastName: 'Wilson',
      userType: UserType.STUDENT,
      status: 'ACTIVE',
      student: {
        create: {
          kajabiUserId: 'kajabi_001',
          courseCompletionDate: new Date('2024-01-15'),
          totalVerifiedHours: 12.5,
          totalVideoHours: 12.5,
          certificationStatus: StudentStatus.IN_PROGRESS,
          preferredSessionLength: 60
        }
      }
    }
  })

  const student2 = await prisma.user.create({
    data: {
      email: 'james.brown@example.com',
      password: studentPassword,
      firstName: 'James',
      lastName: 'Brown',
      userType: UserType.STUDENT,
      status: 'ACTIVE',
      student: {
        create: {
          kajabiUserId: 'kajabi_002',
          courseCompletionDate: new Date('2024-02-01'),
          totalVerifiedHours: 28.0,
          totalVideoHours: 28.0,
          certificationStatus: StudentStatus.IN_PROGRESS,
          preferredSessionLength: 90
        }
      }
    }
  })

  const student3 = await prisma.user.create({
    data: {
      email: 'lisa.garcia@example.com',
      password: studentPassword,
      firstName: 'Lisa',
      lastName: 'Garcia',
      userType: UserType.STUDENT,
      status: 'ACTIVE',
      student: {
        create: {
          kajabiUserId: 'kajabi_003',
          courseCompletionDate: new Date('2024-01-20'),
          totalVerifiedHours: 0,
          totalVideoHours: 0,
          certificationStatus: StudentStatus.ENROLLED,
          preferredSessionLength: 60
        }
      }
    }
  })

  console.log('👥 Created users and profiles')

  // Create notification preferences for all users
  const allUsers = [adminUser, consultant1, consultant2, student1, student2, student3]
  
  for (const user of allUsers) {
    await prisma.userNotificationPreferences.create({
      data: {
        userId: user.id,
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
        notificationTypes: {
          SESSION_SCHEDULED: { email: true, sms: false, inApp: true, push: false },
          SESSION_REMINDER_24H: { email: true, sms: true, inApp: true, push: false },
          SESSION_REMINDER_2H: { email: true, sms: true, inApp: true, push: true },
          SESSION_REMINDER_15M: { email: false, sms: true, inApp: true, push: true },
          SESSION_CANCELLED: { email: true, sms: true, inApp: true, push: true },
          SESSION_RESCHEDULED: { email: true, sms: true, inApp: true, push: true },
          SESSION_COMPLETED: { email: true, sms: false, inApp: true, push: false },
          MILESTONE_REACHED: { email: true, sms: false, inApp: true, push: false },
          PROGRESS_UPDATE: { email: false, sms: false, inApp: true, push: false },
          CERTIFICATION_ELIGIBLE: { email: true, sms: true, inApp: true, push: true },
          CERTIFICATION_COMPLETED: { email: true, sms: true, inApp: true, push: true },
          DOCUMENT_UPLOADED: { email: false, sms: false, inApp: true, push: false },
          DOCUMENT_APPROVED: { email: true, sms: false, inApp: true, push: false },
          DOCUMENT_REJECTED: { email: true, sms: true, inApp: true, push: true },
          DOCUMENT_REVIEW_REQUIRED: { email: true, sms: false, inApp: true, push: false },
          SYSTEM_MAINTENANCE: { email: true, sms: false, inApp: true, push: false },
          SYSTEM_UPDATE: { email: true, sms: false, inApp: true, push: false },
          SECURITY_ALERT: { email: true, sms: true, inApp: true, push: true },
          NEW_BOOKING: { email: true, sms: false, inApp: true, push: false },
          SESSION_VERIFICATION_REQUIRED: { email: true, sms: false, inApp: true, push: false },
          PAYMENT_PROCESSED: { email: true, sms: false, inApp: true, push: false },
          USER_REGISTRATION: { email: false, sms: false, inApp: false, push: false },
          SYSTEM_ALERT: { email: true, sms: false, inApp: true, push: false },
          PERFORMANCE_METRIC: { email: false, sms: false, inApp: false, push: false }
        }
      }
    })
  }

  console.log('🔔 Created notification preferences')

  // Create consultant availability
  const consultant1Data = await prisma.consultant.findUnique({
    where: { userId: consultant1.id }
  })

  const consultant2Data = await prisma.consultant.findUnique({
    where: { userId: consultant2.id }
  })

  if (consultant1Data) {
    await prisma.consultantAvailability.createMany({
      data: [
        {
          consultantId: consultant1Data.id,
          availabilityType: 'RECURRING_WEEKLY',
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'America/New_York'
        },
        {
          consultantId: consultant1Data.id,
          availabilityType: 'RECURRING_WEEKLY',
          dayOfWeek: 2, // Tuesday
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'America/New_York'
        },
        {
          consultantId: consultant1Data.id,
          availabilityType: 'RECURRING_WEEKLY',
          dayOfWeek: 3, // Wednesday
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'America/New_York'
        }
      ]
    })
  }

  if (consultant2Data) {
    await prisma.consultantAvailability.createMany({
      data: [
        {
          consultantId: consultant2Data.id,
          availabilityType: 'RECURRING_WEEKLY',
          dayOfWeek: 4, // Thursday
          startTime: '10:00',
          endTime: '18:00',
          timezone: 'America/Los_Angeles'
        },
        {
          consultantId: consultant2Data.id,
          availabilityType: 'RECURRING_WEEKLY',
          dayOfWeek: 5, // Friday
          startTime: '10:00',
          endTime: '18:00',
          timezone: 'America/Los_Angeles'
        }
      ]
    })
  }

  console.log('📅 Created consultant availability')

  // Create consultation sessions
  const student1Data = await prisma.student.findUnique({
    where: { userId: student1.id }
  })

  const student2Data = await prisma.student.findUnique({
    where: { userId: student2.id }
  })

  if (consultant1Data && student1Data) {
    const session1 = await prisma.consultationSession.create({
      data: {
        studentId: student1Data.id,
        consultantId: consultant1Data.id,
        scheduledStart: new Date('2024-03-15T10:00:00Z'),
        scheduledEnd: new Date('2024-03-15T11:00:00Z'),
        actualStart: new Date('2024-03-15T10:05:00Z'),
        actualEnd: new Date('2024-03-15T11:00:00Z'),
        status: SessionStatus.COMPLETED,
        studentVerifiedAt: new Date('2024-03-15T11:05:00Z'),
        consultantVerifiedAt: new Date('2024-03-15T11:10:00Z'),
        sessionRating: 5
      }
    })

    // Create video session for the consultation
    await prisma.videoSession.create({
      data: {
        consultationSessionId: session1.id,
        roomId: `room_${session1.id}`,
        recordingEnabled: true,
        recordingUrl: 'https://example.com/recordings/session1.mp4',
        recordingDurationSeconds: 3300, // 55 minutes
        videoQuality: '720p',
        connectionQualityAvg: 4.8,
        bandwidthUsageMb: 125.5
      }
    })

    // Create video participants
    await prisma.videoParticipant.createMany({
      data: [
        {
          videoSessionId: (await prisma.videoSession.findUnique({
            where: { consultationSessionId: session1.id }
          }))!.id,
          userId: student1.id,
          userType: UserType.STUDENT,
          joinTime: new Date('2024-03-15T10:05:00Z'),
          leaveTime: new Date('2024-03-15T11:00:00Z'),
          totalDurationSeconds: 3300,
          audioQualityAvg: 4.9,
          videoQualityAvg: 4.8
        },
        {
          videoSessionId: (await prisma.videoSession.findUnique({
            where: { consultationSessionId: session1.id }
          }))!.id,
          userId: consultant1.id,
          userType: UserType.CONSULTANT,
          joinTime: new Date('2024-03-15T10:00:00Z'),
          leaveTime: new Date('2024-03-15T11:00:00Z'),
          totalDurationSeconds: 3600,
          audioQualityAvg: 4.9,
          videoQualityAvg: 4.8
        }
      ]
    })
  }

  if (consultant2Data && student2Data) {
    const session2 = await prisma.consultationSession.create({
      data: {
        studentId: student2Data.id,
        consultantId: consultant2Data.id,
        scheduledStart: new Date('2024-03-20T14:00:00Z'),
        scheduledEnd: new Date('2024-03-20T15:30:00Z'),
        actualStart: new Date('2024-03-20T14:00:00Z'),
        actualEnd: new Date('2024-03-20T15:30:00Z'),
        status: SessionStatus.COMPLETED,
        studentVerifiedAt: new Date('2024-03-20T15:35:00Z'),
        consultantVerifiedAt: new Date('2024-03-20T15:40:00Z'),
        sessionRating: 5
      }
    })

    // Create video session for the consultation
    await prisma.videoSession.create({
      data: {
        consultationSessionId: session2.id,
        roomId: `room_${session2.id}`,
        recordingEnabled: true,
        recordingUrl: 'https://example.com/recordings/session2.mp4',
        recordingDurationSeconds: 5400, // 90 minutes
        videoQuality: '1080p',
        connectionQualityAvg: 4.9,
        bandwidthUsageMb: 180.2
      }
    })
  }

  console.log('📹 Created consultation sessions and video sessions')

  // Create student documents
  if (student1Data) {
    await prisma.studentDocument.createMany({
      data: [
        {
          studentId: student1Data.id,
          documentType: PrismaDocumentType.CONSULTATION_LOG,
          fileName: 'consultation_log_1.pdf',
          fileSizeBytes: 245760,
          filePath: '/documents/student1/consultation_log_1.pdf',
          mimeType: 'application/pdf',
          reviewStatus: ReviewStatus.APPROVED,
          reviewedAt: new Date('2024-03-16T10:00:00Z'),
          autoValidationScore: 0.95
        },
        {
          studentId: student1Data.id,
          documentType: PrismaDocumentType.EVALUATION_FORM,
          fileName: 'evaluation_form_1.pdf',
          fileSizeBytes: 189440,
          filePath: '/documents/student1/evaluation_form_1.pdf',
          mimeType: 'application/pdf',
          reviewStatus: ReviewStatus.PENDING,
          autoValidationScore: 0.87
        }
      ]
    })
  }

  if (student2Data) {
    await prisma.studentDocument.createMany({
      data: [
        {
          studentId: student2Data.id,
          documentType: PrismaDocumentType.CONSULTATION_LOG,
          fileName: 'consultation_log_2.pdf',
          fileSizeBytes: 312320,
          filePath: '/documents/student2/consultation_log_2.pdf',
          mimeType: 'application/pdf',
          reviewStatus: ReviewStatus.APPROVED,
          reviewedAt: new Date('2024-03-21T14:00:00Z'),
          autoValidationScore: 0.92
        },
        {
          studentId: student2Data.id,
          documentType: PrismaDocumentType.REFLECTION_PAPER,
          fileName: 'reflection_paper_1.docx',
          fileSizeBytes: 45678,
          filePath: '/documents/student2/reflection_paper_1.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          reviewStatus: ReviewStatus.UNDER_REVIEW,
          autoValidationScore: 0.78
        }
      ]
    })
  }

  console.log('📄 Created student documents')

  // Create session history
  if (student1Data && consultant1Data) {
    await prisma.sessionHistory.createMany({
      data: [
        {
          studentId: student1Data.id,
          sessionDate: new Date('2024-03-15T10:00:00Z'),
          sessionDuration: 60,
          consultantId: consultant1Data.id,
          sessionType: 'VIDEO_CONSULTATION',
          status: 'COMPLETED',
          rating: 5
        }
      ]
    })
  }

  if (student2Data && consultant2Data) {
    await prisma.sessionHistory.createMany({
      data: [
        {
          studentId: student2Data.id,
          sessionDate: new Date('2024-03-20T14:00:00Z'),
          sessionDuration: 90,
          consultantId: consultant2Data.id,
          sessionType: 'VIDEO_CONSULTATION',
          status: 'COMPLETED',
          rating: 5
        }
      ]
    })
  }

  console.log('📊 Created session history')

  // Create consultant payments
  if (consultant1Data) {
    await prisma.consultantPayment.create({
      data: {
        consultantId: consultant1Data.id,
        paymentPeriod: '2024-03',
        totalHours: 1.0,
        hourlyRate: 175.00,
        totalAmount: 175.00,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date('2024-03-31T00:00:00Z'),
        sessionBreakdown: {
          sessions: [
            {
              sessionId: 'session1',
              date: '2024-03-15',
              duration: 1.0,
              amount: 175.00
            }
          ]
        }
      }
    })
  }

  if (consultant2Data) {
    await prisma.consultantPayment.create({
      data: {
        consultantId: consultant2Data.id,
        paymentPeriod: '2024-03',
        totalHours: 1.5,
        hourlyRate: 200.00,
        totalAmount: 300.00,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date('2024-03-31T00:00:00Z'),
        sessionBreakdown: {
          sessions: [
            {
              sessionId: 'session2',
              date: '2024-03-20',
              duration: 1.5,
              amount: 300.00
            }
          ]
        }
      }
    })
  }

  console.log('💰 Created consultant payments')

  // Create sample in-app notifications
  await prisma.inAppNotification.createMany({
    data: [
      {
        userId: student1.id,
        title: 'Session Scheduled',
        message: 'Your consultation session with Dr. Sarah Johnson has been scheduled for March 15, 2024 at 10:00 AM.',
        type: 'SESSION_SCHEDULED',
        read: false,
        data: { sessionId: 'session1', consultantName: 'Dr. Sarah Johnson' }
      },
      {
        userId: student1.id,
        title: 'Document Approved',
        message: 'Your consultation log has been approved. Great work!',
        type: 'DOCUMENT_APPROVED',
        read: true,
        data: { documentName: 'consultation_log_1.pdf' }
      },
      {
        userId: student2.id,
        title: 'Milestone Reached',
        message: 'Congratulations! You\'ve completed 28 hours of consultation.',
        type: 'MILESTONE_REACHED',
        read: false,
        data: { milestoneName: '28 Hours', hoursCompleted: 28 }
      },
      {
        userId: consultant1.id,
        title: 'New Booking',
        message: 'New consultation session booked with Emma Wilson for March 15, 2024.',
        type: 'NEW_BOOKING',
        read: false,
        data: { studentName: 'Emma Wilson', sessionDate: '2024-03-15' }
      }
    ]
  })

  console.log('🔔 Created sample notifications')

  // Create system health metrics
  await prisma.systemHealthMetric.createMany({
    data: [
      {
        metricType: 'active_users',
        metricValue: 5,
        metricUnit: 'users',
        additionalData: { userTypes: { students: 3, consultants: 2, admins: 1 } }
      },
      {
        metricType: 'video_sessions_today',
        metricValue: 2,
        metricUnit: 'sessions',
        additionalData: { averageDuration: 75, successRate: 100 }
      },
      {
        metricType: 'system_uptime',
        metricValue: 99.9,
        metricUnit: 'percentage',
        additionalData: { lastDowntime: null }
      }
    ]
  })

  console.log('📈 Created system health metrics')

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📋 Created test data:')
  console.log('- 1 Admin user (admin@brainbasedemdr.com / admin123)')
  console.log('- 2 Consultant users (dr.sarah@brainbasedemdr.com, dr.michael@brainbasedemdr.com / consultant123)')
  console.log('- 3 Student users (emma.wilson@example.com, james.brown@example.com, lisa.garcia@example.com / student123)')
  console.log('- 2 Completed consultation sessions with video recordings')
  console.log('- 4 Student documents (consultation logs, evaluations, reflection papers)')
  console.log('- Consultant availability schedules')
  console.log('- Payment records for consultants')
  console.log('- Notification preferences for all users')
  console.log('- Sample in-app notifications')
  console.log('- System health metrics')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 