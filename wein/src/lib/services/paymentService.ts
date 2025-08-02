// Payment service for handling Stripe integration
// In production, integrate with Stripe for consultant payments

interface PaymentData {
  consultantId: string
  amount: number
  currency: string
  description: string
  sessionIds: string[]
  paymentPeriod: string
}

interface PaymentResult {
  success: boolean
  paymentId?: string
  error?: string
  amount?: number
  status?: string
}

interface InvoiceData {
  consultantId: string
  paymentPeriod: string
  sessions: Array<{
    id: string
    date: string
    duration: number
    rate: number
    amount: number
  }>
  totalAmount: number
}

export class PaymentService {
  private static isProduction = process.env.NODE_ENV === 'production'
  private static stripeSecretKey = process.env.STRIPE_SECRET_KEY
  private static stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  static async processConsultantPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      if (this.isProduction && !this.stripeSecretKey) {
        throw new Error('Stripe secret key not configured')
      }

      if (this.isProduction) {
        return await this.processStripePayment(paymentData)
      } else {
        return await this.processMockPayment(paymentData)
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }

  static async generateInvoice(invoiceData: InvoiceData): Promise<string> {
    try {
      const invoiceNumber = `INV-${Date.now()}-${invoiceData.consultantId.slice(-6)}`
      
      // In production, generate a proper PDF invoice
      const invoiceContent = this.generateInvoiceHTML(invoiceData, invoiceNumber)
      
      // For now, we'll just log the invoice
      console.log('Generated Invoice:', {
        invoiceNumber,
        consultantId: invoiceData.consultantId,
        totalAmount: invoiceData.totalAmount,
        sessions: invoiceData.sessions.length
      })

      return invoiceNumber
    } catch (error) {
      console.error('Invoice generation error:', error)
      throw new Error('Failed to generate invoice')
    }
  }

  static async getPaymentHistory(consultantId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get payment history from database
      const payments = await this.getConsultantPayments(consultantId, limit)
      
      return payments.map(payment => ({
        id: payment.id,
        amount: payment.totalAmount,
        status: payment.paymentStatus,
        date: payment.paymentDate,
        period: payment.paymentPeriod,
        sessions: payment.sessionBreakdown
      }))
    } catch (error) {
      console.error('Payment history error:', error)
      return []
    }
  }

  static async calculateConsultantEarnings(consultantId: string, period: string): Promise<{
    totalHours: number
    totalAmount: number
    sessions: number
    averageRate: number
  }> {
    try {
      // Get verified sessions for the consultant in the specified period
      const sessions = await this.getConsultantSessions(consultantId, period)
      
      const totalHours = sessions.reduce((sum, session) => sum + session.duration, 0)
      const totalAmount = sessions.reduce((sum, session) => sum + session.amount, 0)
      const averageRate = sessions.length > 0 ? totalAmount / totalHours : 0

      return {
        totalHours,
        totalAmount,
        sessions: sessions.length,
        averageRate
      }
    } catch (error) {
      console.error('Earnings calculation error:', error)
      return {
        totalHours: 0,
        totalAmount: 0,
        sessions: 0,
        averageRate: 0
      }
    }
  }

  private static async processStripePayment(paymentData: PaymentData): Promise<PaymentResult> {
    // TODO: Implement actual Stripe integration
    console.log('Stripe payment processing not yet implemented')
    
    // Mock successful payment for now
    return {
      success: true,
      paymentId: `stripe_${Date.now()}`,
      amount: paymentData.amount,
      status: 'succeeded'
    }
  }

  private static async processMockPayment(paymentData: PaymentData): Promise<PaymentResult> {
    console.log('💰 MOCK PAYMENT PROCESSED:')
    console.log('Consultant ID:', paymentData.consultantId)
    console.log('Amount:', paymentData.amount, paymentData.currency)
    console.log('Description:', paymentData.description)
    console.log('Sessions:', paymentData.sessionIds)
    console.log('Period:', paymentData.paymentPeriod)
    console.log('---')

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05

    if (isSuccess) {
      return {
        success: true,
        paymentId: `mock_${Date.now()}`,
        amount: paymentData.amount,
        status: 'succeeded'
      }
    } else {
      return {
        success: false,
        error: 'Mock payment failed (simulated)'
      }
    }
  }

  private static generateInvoiceHTML(invoiceData: InvoiceData, invoiceNumber: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #667eea; padding: 20px 0;">
          <h1 style="color: #667eea; margin: 0;">BrainBased EMDR</h1>
          <p style="color: #666; margin: 5px 0;">Consultant Payment Invoice</p>
        </div>
        
        <div style="padding: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3>Invoice Details</h3>
              <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
              <p><strong>Period:</strong> ${invoiceData.paymentPeriod}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <h3>Payment Summary</h3>
              <p><strong>Total Sessions:</strong> ${invoiceData.sessions.length}</p>
              <p><strong>Total Hours:</strong> ${invoiceData.sessions.reduce((sum, s) => sum + s.duration, 0)}</p>
              <p><strong>Total Amount:</strong> $${invoiceData.totalAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Session Date</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Duration (hrs)</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Rate ($/hr)</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.sessions.map(session => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${session.date}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${session.duration}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">$${session.rate.toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${session.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f9f9f9; font-weight: bold;">
                <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total:</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${invoiceData.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px;">
            <h4>Payment Information</h4>
            <p>Payment will be processed within 5-7 business days.</p>
            <p>For questions about this invoice, please contact our support team.</p>
          </div>
        </div>
      </div>
    `
  }

  private static async getConsultantPayments(consultantId: string, limit: number): Promise<any[]> {
    // TODO: Implement database query for payment history
    return []
  }

  private static async getConsultantSessions(consultantId: string, period: string): Promise<any[]> {
    // TODO: Implement database query for consultant sessions
    return []
  }
} 