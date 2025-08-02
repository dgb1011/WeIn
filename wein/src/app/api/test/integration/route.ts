import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EmailService } from '@/lib/services/emailService'
import { PaymentService } from '@/lib/services/paymentService'

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  }

  // Test 1: Database Connection
  try {
    await db.$queryRaw`SELECT 1`
    testResults.tests.push({
      name: 'Database Connection',
      status: 'PASSED',
      message: 'Database connection successful'
    })
    testResults.summary.passed++
  } catch (error) {
    testResults.tests.push({
      name: 'Database Connection',
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  // Test 2: Email Service
  try {
    const emailResult = await EmailService.sendWelcomeEmail('test@example.com', 'Test User')
    testResults.tests.push({
      name: 'Email Service',
      status: 'PASSED',
      message: 'Email service working (development mode)',
      details: { result: emailResult }
    })
    testResults.summary.passed++
  } catch (error) {
    testResults.tests.push({
      name: 'Email Service',
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  // Test 3: Payment Service
  try {
    const paymentResult = await PaymentService.processConsultantPayment({
      consultantId: 'test-consultant',
      amount: 150.00,
      currency: 'USD',
      description: 'Test payment',
      sessionIds: ['test-session-1'],
      paymentPeriod: '2024-01-01 to 2024-01-31'
    })
    testResults.tests.push({
      name: 'Payment Service',
      status: 'PASSED',
      message: 'Payment service working (mock mode)',
      details: { result: paymentResult }
    })
    testResults.summary.passed++
  } catch (error) {
    testResults.tests.push({
      name: 'Payment Service',
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  // Test 4: Database Schema
  try {
    const userCount = await db.user.count()
    const studentCount = await db.student.count()
    const consultantCount = await db.consultant.count()
    
    testResults.tests.push({
      name: 'Database Schema',
      status: 'PASSED',
      message: 'Database schema accessible',
      details: {
        users: userCount,
        students: studentCount,
        consultants: consultantCount
      }
    })
    testResults.summary.passed++
  } catch (error) {
    testResults.tests.push({
      name: 'Database Schema',
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  // Test 5: Environment Variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET'
  ]
  
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingEnvVars.length === 0) {
    testResults.tests.push({
      name: 'Environment Variables',
      status: 'PASSED',
      message: 'All required environment variables are set'
    })
    testResults.summary.passed++
  } else {
    testResults.tests.push({
      name: 'Environment Variables',
      status: 'FAILED',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  // Test 6: API Endpoints
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Test auth endpoint
    const authResponse = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email: 'test@example.com',
        password: 'testpassword'
      })
    })
    
    testResults.tests.push({
      name: 'API Endpoints',
      status: 'PASSED',
      message: 'API endpoints responding',
      details: {
        authEndpoint: authResponse.status
      }
    })
    testResults.summary.passed++
  } catch (error) {
    testResults.tests.push({
      name: 'API Endpoints',
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    testResults.summary.failed++
  }
  testResults.summary.total++

  return NextResponse.json(testResults)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType, testData } = body

    switch (testType) {
      case 'create-test-user':
        return await createTestUser(testData)
      
      case 'create-test-consultant':
        return await createTestConsultant(testData)
      
      case 'create-test-session':
        return await createTestSession(testData)
      
      case 'test-kajabi-webhook':
        return await testKajabiWebhook(testData)
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Integration test error:', error)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}

async function createTestUser(testData: any) {
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash('testpassword123', 12)
  
  const user = await db.user.create({
    data: {
      email: testData.email || 'test@example.com',
      password: hashedPassword,
      firstName: testData.firstName || 'Test',
      lastName: testData.lastName || 'User',
      userType: 'STUDENT',
      status: 'ACTIVE',
      student: {
        create: {
          kajabiUserId: 'test-kajabi-123',
          courseCompletionDate: new Date(),
          totalVerifiedHours: 0,
          totalVideoHours: 0,
          certificationStatus: 'ENROLLED'
        }
      }
    },
    include: { student: true }
  })

  return NextResponse.json({
    message: 'Test user created successfully',
    user: {
      id: user.id,
      email: user.email,
      studentId: user.student?.id
    }
  })
}

async function createTestConsultant(testData: any) {
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash('testpassword123', 12)
  
  const user = await db.user.create({
    data: {
      email: testData.email || 'consultant@example.com',
      password: hashedPassword,
      firstName: testData.firstName || 'Test',
      lastName: testData.lastName || 'Consultant',
      userType: 'CONSULTANT',
      status: 'ACTIVE',
      consultant: {
        create: {
          bio: 'Test consultant bio',
          specialties: ['EMDR', 'Trauma'],
          hourlyRate: 150.00,
          isActive: true,
          timezone: 'UTC'
        }
      }
    },
    include: { consultant: true }
  })

  return NextResponse.json({
    message: 'Test consultant created successfully',
    user: {
      id: user.id,
      email: user.email,
      consultantId: user.consultant?.id
    }
  })
}

async function createTestSession(testData: any) {
  const session = await db.consultationSession.create({
    data: {
      studentId: testData.studentId,
      consultantId: testData.consultantId,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      status: 'COMPLETED',
      actualStart: new Date(),
      actualEnd: new Date(Date.now() + 60 * 60 * 1000),
      studentVerifiedAt: new Date(),
      consultantVerifiedAt: new Date()
    }
  })

  return NextResponse.json({
    message: 'Test session created successfully',
    session: {
      id: session.id,
      studentId: session.studentId,
      consultantId: session.consultantId
    }
  })
}

async function testKajabiWebhook(testData: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const response = await fetch(`${baseUrl}/api/test/kajabi-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'course.completed',
      testData: testData
    })
  })

  const result = await response.json()

  return NextResponse.json({
    message: 'Kajabi webhook test completed',
    result
  })
} 