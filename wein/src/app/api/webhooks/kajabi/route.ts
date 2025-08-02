import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EmailService } from '@/lib/services/emailService'
import crypto from 'crypto'

const KAJABI_WEBHOOK_SECRET = process.env.KAJABI_WEBHOOK_SECRET || 'your-webhook-secret'

interface KajabiWebhookPayload {
  event: string
  data: {
    user: {
      id: string
      email: string
      first_name: string
      last_name: string
      phone?: string
    }
    course?: {
      id: string
      name: string
      completion_date: string
    }
    product?: {
      id: string
      name: string
    }
  }
  timestamp: number
  signature: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-kajabi-signature')
    
    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload: KajabiWebhookPayload = JSON.parse(body)
    console.log('Received Kajabi webhook:', payload.event, payload.data)

    // Handle different webhook events
    switch (payload.event) {
      case 'course.completed':
        return await handleCourseCompletion(payload.data)
      
      case 'user.created':
        return await handleUserCreated(payload.data)
      
      case 'user.updated':
        return await handleUserUpdated(payload.data)
      
      case 'product.purchased':
        return await handleProductPurchased(payload.data)
      
      default:
        console.log('Unhandled webhook event:', payload.event)
        return NextResponse.json({ message: 'Event received' })
    }
  } catch (error) {
    console.error('Kajabi webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  const expectedSignature = crypto
    .createHmac('sha256', KAJABI_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

async function handleCourseCompletion(data: KajabiWebhookPayload['data']) {
  try {
    const { user, course } = data
    
    if (!course) {
      throw new Error('Course data missing from webhook')
    }

    // Check if user already exists in our system
    let existingUser = await db.user.findUnique({
      where: { email: user.email },
      include: { student: true }
    })

    if (!existingUser) {
      // Create new user and student record
      const hashedPassword = await generateTemporaryPassword()
      
      existingUser = await db.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          userType: 'STUDENT',
          status: 'ACTIVE',
          student: {
            create: {
              kajabiUserId: user.id,
              courseCompletionDate: new Date(course.completion_date),
              totalVerifiedHours: 0,
              totalVideoHours: 0,
              certificationStatus: 'ENROLLED',
              preferredSessionLength: 60,
              consultationPreferences: {
                timezone: 'UTC',
                preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                preferredTimes: ['morning', 'afternoon']
              }
            }
          }
        },
        include: { student: true }
      })

      console.log('Created new student from Kajabi:', existingUser.id)
    } else {
      // Update existing student's course completion
      if (existingUser.student) {
        await db.student.update({
          where: { id: existingUser.student.id },
          data: {
            courseCompletionDate: new Date(course.completion_date),
            certificationStatus: 'CONSULTATION_ACCESS_GRANTED'
          }
        })
      }
    }

    // Send welcome email with consultation access
    await EmailService.sendWelcomeEmail(user.email, `${user.first_name} ${user.last_name}`)

    // Send consultation access notification
    await EmailService.sendConsultationAccessEmail({
      email: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      courseName: course.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/student`
    })

    console.log('Course completion processed successfully for:', user.email)
    
    return NextResponse.json({
      message: 'Course completion processed successfully',
      userId: existingUser.id
    })

  } catch (error) {
    console.error('Error handling course completion:', error)
    return NextResponse.json(
      { error: 'Failed to process course completion' },
      { status: 500 }
    )
  }
}

async function handleUserCreated(data: KajabiWebhookPayload['data']) {
  try {
    const { user } = data
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: user.email }
    })

    if (!existingUser) {
      // Create user record (but not student yet - wait for course completion)
      const hashedPassword = await generateTemporaryPassword()
      
      await db.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          userType: 'STUDENT',
          status: 'ACTIVE'
        }
      })

      console.log('Created new user from Kajabi:', user.email)
    }

    return NextResponse.json({ message: 'User created successfully' })

  } catch (error) {
    console.error('Error handling user creation:', error)
    return NextResponse.json(
      { error: 'Failed to process user creation' },
      { status: 500 }
    )
  }
}

async function handleUserUpdated(data: KajabiWebhookPayload['data']) {
  try {
    const { user } = data
    
    // Update existing user
    await db.user.updateMany({
      where: { email: user.email },
      data: {
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone || null
      }
    })

    console.log('Updated user from Kajabi:', user.email)
    
    return NextResponse.json({ message: 'User updated successfully' })

  } catch (error) {
    console.error('Error handling user update:', error)
    return NextResponse.json(
      { error: 'Failed to process user update' },
      { status: 500 }
    )
  }
}

async function handleProductPurchased(data: KajabiWebhookPayload['data']) {
  try {
    const { user, product } = data
    
    if (!product) {
      throw new Error('Product data missing from webhook')
    }

    // Log the purchase for analytics
    console.log('Product purchased:', {
      user: user.email,
      product: product.name,
      productId: product.id
    })

    // You might want to create a purchase record or update user status
    // For now, we'll just log it

    return NextResponse.json({ message: 'Purchase recorded successfully' })

  } catch (error) {
    console.error('Error handling product purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process product purchase' },
      { status: 500 }
    )
  }
}

async function generateTemporaryPassword(): Promise<string> {
  const bcrypt = await import('bcryptjs')
  const tempPassword = crypto.randomBytes(16).toString('hex')
  return await bcrypt.hash(tempPassword, 12)
} 