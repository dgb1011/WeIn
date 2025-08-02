import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const KAJABI_WEBHOOK_SECRET = process.env.KAJABI_WEBHOOK_SECRET || 'your-webhook-secret'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, testData } = body

    // Create a test webhook payload
    const webhookPayload = {
      event,
      data: testData || {
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567890'
        },
        course: {
          id: 'test-course-456',
          name: 'EMDR Basic Training',
          completion_date: new Date().toISOString()
        }
      },
      timestamp: Date.now(),
      signature: ''
    }

    // Generate signature
    const payloadString = JSON.stringify(webhookPayload)
    const signature = crypto
      .createHmac('sha256', KAJABI_WEBHOOK_SECRET)
      .update(payloadString, 'utf8')
      .digest('hex')

    webhookPayload.signature = signature

    // Send the webhook to our actual endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/kajabi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-kajabi-signature': signature
      },
      body: payloadString
    })

    const result = await response.json()

    return NextResponse.json({
      message: 'Test webhook sent successfully',
      event,
      webhookResponse: result,
      status: response.status
    })

  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Kajabi Webhook Test Endpoint',
    availableEvents: [
      'course.completed',
      'user.created',
      'user.updated',
      'product.purchased'
    ],
    usage: {
      method: 'POST',
      body: {
        event: 'course.completed',
        testData: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User'
          },
          course: {
            id: 'test-course-456',
            name: 'EMDR Basic Training',
            completion_date: new Date().toISOString()
          }
        }
      }
    }
  })
} 