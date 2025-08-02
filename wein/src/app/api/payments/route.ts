import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/paymentService'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, consultantId, paymentPeriod, sessionIds } = body

    switch (action) {
      case 'process-payment':
        return await handleProcessPayment(body)
      
      case 'generate-invoice':
        return await handleGenerateInvoice(body)
      
      case 'get-payment-history':
        return await handleGetPaymentHistory(body)
      
      case 'calculate-earnings':
        return await handleCalculateEarnings(body)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "process-payment", "generate-invoice", "get-payment-history", or "calculate-earnings".' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Payment API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleProcessPayment(body: any) {
  const { consultantId, paymentPeriod, sessionIds } = body

  if (!consultantId || !paymentPeriod || !sessionIds || !Array.isArray(sessionIds)) {
    return NextResponse.json(
      { error: 'Missing required fields: consultantId, paymentPeriod, sessionIds' },
      { status: 400 }
    )
  }

  try {
    // Get consultant information
    const consultant = await db.consultant.findUnique({
      where: { id: consultantId },
      include: { user: true }
    })

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant not found' },
        { status: 404 }
      )
    }

    // Get verified sessions for the payment period
    const sessions = await db.consultationSession.findMany({
      where: {
        consultantId,
        status: 'COMPLETED',
        consultantVerifiedAt: { not: null },
        scheduledStart: {
          gte: new Date(paymentPeriod.split('-')[0]),
          lt: new Date(paymentPeriod.split('-')[1])
        }
      }
    })

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No verified sessions found for the specified period' },
        { status: 404 }
      )
    }

    // Calculate total amount
    const totalAmount = sessions.reduce((sum, session) => {
      const duration = (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60)
      return sum + (duration * consultant.hourlyRate)
    }, 0)

    // Process payment
    const paymentResult = await PaymentService.processConsultantPayment({
      consultantId,
      amount: totalAmount,
      currency: 'USD',
      description: `Consultation services for ${paymentPeriod}`,
      sessionIds: sessions.map(s => s.id),
      paymentPeriod
    })

    if (paymentResult.success) {
      // Create payment record in database
      const payment = await db.consultantPayment.create({
        data: {
          consultantId,
          paymentPeriod,
          totalHours: sessions.reduce((sum, session) => {
            const duration = (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60)
            return sum + duration
          }, 0),
          hourlyRate: consultant.hourlyRate,
          totalAmount,
          paymentStatus: 'PAID',
          paymentDate: new Date(),
          sessionBreakdown: sessions.map(session => ({
            sessionId: session.id,
            date: session.scheduledStart,
            duration: (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60),
            amount: (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60) * consultant.hourlyRate
          }))
        }
      })

      return NextResponse.json({
        message: 'Payment processed successfully',
        payment: {
          id: payment.id,
          amount: payment.totalAmount,
          status: payment.paymentStatus,
          date: payment.paymentDate
        },
        paymentResult
      })
    } else {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment processing failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Process payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

async function handleGenerateInvoice(body: any) {
  const { consultantId, paymentPeriod } = body

  if (!consultantId || !paymentPeriod) {
    return NextResponse.json(
      { error: 'Missing required fields: consultantId, paymentPeriod' },
      { status: 400 }
    )
  }

  try {
    // Get consultant information
    const consultant = await db.consultant.findUnique({
      where: { id: consultantId },
      include: { user: true }
    })

    if (!consultant) {
      return NextResponse.json(
        { error: 'Consultant not found' },
        { status: 404 }
      )
    }

    // Get verified sessions for the payment period
    const sessions = await db.consultationSession.findMany({
      where: {
        consultantId,
        status: 'COMPLETED',
        consultantVerifiedAt: { not: null },
        scheduledStart: {
          gte: new Date(paymentPeriod.split('-')[0]),
          lt: new Date(paymentPeriod.split('-')[1])
        }
      }
    })

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No verified sessions found for the specified period' },
        { status: 404 }
      )
    }

    // Calculate total amount
    const totalAmount = sessions.reduce((sum, session) => {
      const duration = (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60)
      return sum + (duration * consultant.hourlyRate)
    }, 0)

    // Generate invoice
    const invoiceNumber = await PaymentService.generateInvoice({
      consultantId,
      paymentPeriod,
      sessions: sessions.map(session => ({
        id: session.id,
        date: session.scheduledStart.toLocaleDateString(),
        duration: (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60),
        rate: consultant.hourlyRate,
        amount: (new Date(session.actualEnd!).getTime() - new Date(session.actualStart!).getTime()) / (1000 * 60 * 60) * consultant.hourlyRate
      })),
      totalAmount
    })

    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoiceNumber,
      totalAmount,
      sessions: sessions.length
    })
  } catch (error) {
    console.error('Generate invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}

async function handleGetPaymentHistory(body: any) {
  const { consultantId, limit = 10 } = body

  if (!consultantId) {
    return NextResponse.json(
      { error: 'Missing required field: consultantId' },
      { status: 400 }
    )
  }

  try {
    const payments = await db.consultantPayment.findMany({
      where: { consultantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        amount: payment.totalAmount,
        status: payment.paymentStatus,
        date: payment.paymentDate,
        period: payment.paymentPeriod,
        sessions: payment.sessionBreakdown
      }))
    })
  } catch (error) {
    console.error('Get payment history error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    )
  }
}

async function handleCalculateEarnings(body: any) {
  const { consultantId, period } = body

  if (!consultantId || !period) {
    return NextResponse.json(
      { error: 'Missing required fields: consultantId, period' },
      { status: 400 }
    )
  }

  try {
    const earnings = await PaymentService.calculateConsultantEarnings(consultantId, period)
    
    return NextResponse.json({
      earnings
    })
  } catch (error) {
    console.error('Calculate earnings error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate earnings' },
      { status: 500 }
    )
  }
} 