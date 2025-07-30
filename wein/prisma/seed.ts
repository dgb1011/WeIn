import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@brainbasedemdr.com' },
    update: {},
    create: {
      email: 'admin@brainbasedemdr.com',
      firstName: 'Admin',
      lastName: 'User',
      userType: 'ADMIN',
      admin: {
        create: {
          role: 'super_admin',
          permissions: ['manage_users', 'manage_system', 'view_analytics']
        }
      }
    }
  })

  const consultantUser = await prisma.user.upsert({
    where: { email: 'consultant@brainbasedemdr.com' },
    update: {},
    create: {
      email: 'consultant@brainbasedemdr.com',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      userType: 'CONSULTANT',
      consultant: {
        create: {
          bio: 'Experienced EMDR practitioner with 10+ years of clinical experience',
          specialties: ['EMDR Basic', 'EMDR Advanced', 'Trauma Therapy'],
          hourlyRate: 150.00,
          isActive: true
        }
      }
    }
  })

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@brainbasedemdr.com' },
    update: {},
    create: {
      email: 'student@brainbasedemdr.com',
      firstName: 'Alex',
      lastName: 'Smith',
      userType: 'STUDENT',
      student: {
        create: {
          kajabiUserId: 'kajabi_12345',
          courseCompletionDate: new Date('2024-01-15'),
          totalVerifiedHours: 12.5,
          totalVideoHours: 12.5,
          certificationStatus: 'IN_PROGRESS',
          preferredSessionLength: 60
        }
      }
    }
  })

  // Create consultant availability
  const availability = await prisma.consultantAvailability.create({
    data: {
      consultantId: consultantUser.consultant!.id,
      availabilityType: 'RECURRING_WEEKLY',
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '17:00',
      maxSessions: 8,
      bufferMinutes: 15,
      isAvailable: true,
      bookingWindowDays: 30,
      minimumNoticeHours: 24,
      autoApprove: true,
      timezone: 'America/New_York'
    }
  })

  // Create sample consultation sessions
  const session1 = await prisma.consultationSession.create({
    data: {
      studentId: studentUser.student!.id,
      consultantId: consultantUser.consultant!.id,
      scheduledStart: new Date('2024-02-01T10:00:00Z'),
      scheduledEnd: new Date('2024-02-01T11:00:00Z'),
      actualStart: new Date('2024-02-01T10:00:00Z'),
      actualEnd: new Date('2024-02-01T11:00:00Z'),
      status: 'COMPLETED',
      sessionType: 'VIDEO_CONSULTATION',
      studentVerifiedAt: new Date('2024-02-01T11:05:00Z'),
      consultantVerifiedAt: new Date('2024-02-01T11:10:00Z'),
      sessionRating: 5
    }
  })

  const session2 = await prisma.consultationSession.create({
    data: {
      studentId: studentUser.student!.id,
      consultantId: consultantUser.consultant!.id,
      scheduledStart: new Date('2024-02-08T10:00:00Z'),
      scheduledEnd: new Date('2024-02-08T11:00:00Z'),
      actualStart: new Date('2024-02-08T10:00:00Z'),
      actualEnd: new Date('2024-02-08T11:00:00Z'),
      status: 'COMPLETED',
      sessionType: 'VIDEO_CONSULTATION',
      studentVerifiedAt: new Date('2024-02-08T11:05:00Z'),
      consultantVerifiedAt: new Date('2024-02-08T11:10:00Z'),
      sessionRating: 5
    }
  })

  // Create video sessions
  const videoSession1 = await prisma.videoSession.create({
    data: {
      consultationSessionId: session1.id,
      roomId: `room_${session1.id}`,
      recordingEnabled: true,
      recordingUrl: 'https://example.com/recordings/session1.mp4',
      recordingDurationSeconds: 3600,
      videoQuality: '720p',
      connectionQualityAvg: 4.8,
      bandwidthUsageMb: 150.5
    }
  })

  const videoSession2 = await prisma.videoSession.create({
    data: {
      consultationSessionId: session2.id,
      roomId: `room_${session2.id}`,
      recordingEnabled: true,
      recordingUrl: 'https://example.com/recordings/session2.mp4',
      recordingDurationSeconds: 3600,
      videoQuality: '720p',
      connectionQualityAvg: 4.9,
      bandwidthUsageMb: 145.2
    }
  })

  // Create video participants
  await prisma.videoParticipant.createMany({
    data: [
      {
        videoSessionId: videoSession1.id,
        userId: studentUser.id,
        userType: 'STUDENT',
        joinTime: new Date('2024-02-01T10:00:00Z'),
        leaveTime: new Date('2024-02-01T11:00:00Z'),
        totalDurationSeconds: 3600,
        audioQualityAvg: 4.8,
        videoQualityAvg: 4.7,
        screenShareDurationSeconds: 300,
        chatMessagesCount: 5
      },
      {
        videoSessionId: videoSession1.id,
        userId: consultantUser.id,
        userType: 'CONSULTANT',
        joinTime: new Date('2024-02-01T09:55:00Z'),
        leaveTime: new Date('2024-02-01T11:05:00Z'),
        totalDurationSeconds: 4200,
        audioQualityAvg: 4.9,
        videoQualityAvg: 4.8,
        screenShareDurationSeconds: 600,
        chatMessagesCount: 8
      }
    ]
  })

  // Create sample documents
  await prisma.studentDocument.create({
    data: {
      studentId: studentUser.student!.id,
      documentType: 'CONSULTATION_LOG',
      fileName: 'consultation_log_1.pdf',
      fileSizeBytes: 1024000,
      filePath: '/uploads/consultation_log_1.pdf',
      mimeType: 'application/pdf',
      extractedText: 'Sample consultation log content...',
      reviewStatus: 'APPROVED',
      reviewedBy: adminUser.id,
      reviewedAt: new Date('2024-02-02T10:00:00Z'),
      autoValidationScore: 0.95
    }
  })

  // Create session history
  await prisma.sessionHistory.createMany({
    data: [
      {
        studentId: studentUser.student!.id,
        sessionDate: new Date('2024-02-01T10:00:00Z'),
        sessionDuration: 60,
        consultantId: consultantUser.consultant!.id,
        sessionType: 'VIDEO_CONSULTATION',
        status: 'COMPLETED',
        rating: 5
      },
      {
        studentId: studentUser.student!.id,
        sessionDate: new Date('2024-02-08T10:00:00Z'),
        sessionDuration: 60,
        consultantId: consultantUser.consultant!.id,
        sessionType: 'VIDEO_CONSULTATION',
        status: 'COMPLETED',
        rating: 5
      }
    ]
  })

  // Create consultant payment
  await prisma.consultantPayment.create({
    data: {
      consultantId: consultantUser.consultant!.id,
      paymentPeriod: '2024-02',
      totalHours: 2.0,
      hourlyRate: 150.00,
      totalAmount: 300.00,
      paymentStatus: 'PAID',
      paymentDate: new Date('2024-02-15T00:00:00Z'),
      sessionBreakdown: {
        sessions: [
          { sessionId: session1.id, hours: 1.0, amount: 150.00 },
          { sessionId: session2.id, hours: 1.0, amount: 150.00 }
        ]
      }
    }
  })

  // Create system health metrics
  await prisma.systemHealthMetric.createMany({
    data: [
      {
        metricType: 'video_session_quality',
        metricValue: 4.85,
        metricUnit: 'stars',
        additionalData: { totalSessions: 2, avgConnectionQuality: 4.8 }
      },
      {
        metricType: 'system_uptime',
        metricValue: 99.9,
        metricUnit: 'percentage',
        additionalData: { lastDowntime: null }
      },
      {
        metricType: 'active_users',
        metricValue: 3,
        metricUnit: 'count',
        additionalData: { students: 1, consultants: 1, admins: 1 }
      }
    ]
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('📊 Sample data created:')
  console.log(`   - Admin user: ${adminUser.email}`)
  console.log(`   - Consultant: ${consultantUser.email}`)
  console.log(`   - Student: ${studentUser.email}`)
  console.log(`   - Sessions: 2 completed sessions`)
  console.log(`   - Documents: 1 uploaded document`)
  console.log(`   - Payments: 1 payment record`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 