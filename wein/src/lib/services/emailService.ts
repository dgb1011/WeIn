// Email service for handling password reset and notifications
// In production, integrate with SendGrid, AWS SES, or similar

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface PasswordResetEmailData {
  email: string
  resetToken: string
  resetUrl: string
  userName: string
}

export class EmailService {
  private static isProduction = process.env.NODE_ENV === 'production'
  private static emailProvider = process.env.EMAIL_PROVIDER || 'console'

  static async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const { email, resetToken, resetUrl, userName } = data
    
    const subject = 'Reset Your BrainBased EMDR Password'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">BrainBased EMDR</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password for your BrainBased EMDR account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent to ${email}. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `
    
    const text = `
      Password Reset Request
      
      Hello ${userName},
      
      We received a request to reset your password for your BrainBased EMDR account. 
      If you didn't make this request, you can safely ignore this email.
      
      Reset your password: ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you have any questions, please contact our support team.
    `

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    })
  }

  static async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    const subject = 'Welcome to BrainBased EMDR'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">BrainBased EMDR</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to BrainBased EMDR!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to BrainBased EMDR! Your account has been successfully created and you're now ready to begin your EMDR consultation journey.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Here's what you can do next:
          </p>
          
          <ul style="color: #666; line-height: 1.6;">
            <li>Complete your profile information</li>
            <li>Schedule your first consultation session</li>
            <li>Upload required documents</li>
            <li>Track your progress toward certification</li>
          </ul>
          
          <p style="color: #666; line-height: 1.6;">
            If you have any questions or need assistance, our support team is here to help.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Thank you for choosing BrainBased EMDR for your professional development.
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject,
      html
    })
  }

  static async sendSessionReminder(email: string, userName: string, sessionData: {
    date: string
    time: string
    consultantName: string
    joinUrl: string
  }): Promise<boolean> {
    const subject = 'Upcoming EMDR Consultation Session Reminder'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">BrainBased EMDR</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Session Reminder</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            This is a reminder for your upcoming EMDR consultation session:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionData.date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionData.time}</p>
            <p style="margin: 5px 0;"><strong>Consultant:</strong> ${sessionData.consultantName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${sessionData.joinUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Join Session
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Please ensure you have a stable internet connection and are in a quiet, private space for your session.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Need to reschedule? Contact your consultant or our support team.
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject,
      html
    })
  }

  static async sendConsultationAccessEmail(data: {
    email: string
    userName: string
    courseName: string
    dashboardUrl: string
  }): Promise<boolean> {
    const { email, userName, courseName, dashboardUrl } = data
    
    const subject = 'Your EMDR Consultation Access is Ready!'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">BrainBased EMDR</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">🎉 Congratulations!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Congratulations on completing <strong>${courseName}</strong>! You've successfully finished the course and are now ready to begin your EMDR consultation journey.
          </p>
          
          <div style="background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>Schedule your first consultation session</li>
              <li>Complete your 40-hour consultation requirement</li>
              <li>Track your progress in real-time</li>
              <li>Receive your certification upon completion</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Your consultation dashboard is now active and ready for you to:
          </p>
          
          <ul style="color: #666; line-height: 1.6;">
            <li>Browse available consultants and their schedules</li>
            <li>Book consultation sessions at your convenience</li>
            <li>Track your progress toward the 40-hour requirement</li>
            <li>Upload required documentation</li>
            <li>Monitor your certification timeline</li>
          </ul>
          
          <p style="color: #666; line-height: 1.6;">
            If you have any questions about the consultation process or need assistance getting started, our support team is here to help.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Welcome to the next phase of your EMDR certification journey!
          </p>
        </div>
      </div>
    `

    return this.sendEmail({
      to: email,
      subject,
      html
    })
  }

  private static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (this.isProduction) {
        // In production, integrate with actual email service
        switch (this.emailProvider) {
          case 'sendgrid':
            return await this.sendViaSendGrid(options)
          case 'ses':
            return await this.sendViaSES(options)
          default:
            console.warn('No email provider configured, falling back to console logging')
            return this.logEmailToConsole(options)
        }
      } else {
        // In development, log to console
        return this.logEmailToConsole(options)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private static logEmailToConsole(options: EmailOptions): boolean {
    console.log('📧 EMAIL SENT (Development Mode):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('HTML:', options.html)
    if (options.text) {
      console.log('Text:', options.text)
    }
    console.log('---')
    return true
  }

  private static async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    // TODO: Implement SendGrid integration
    console.log('SendGrid integration not yet implemented')
    return this.logEmailToConsole(options)
  }

  private static async sendViaSES(options: EmailOptions): Promise<boolean> {
    // TODO: Implement AWS SES integration
    console.log('AWS SES integration not yet implemented')
    return this.logEmailToConsole(options)
  }
} 