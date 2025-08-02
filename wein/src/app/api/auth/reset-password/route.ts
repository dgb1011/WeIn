import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, token, newPassword } = body

    if (action === 'forgot-password') {
      return await handleForgotPassword({ email })
    } else if (action === 'reset-password') {
      return await handleResetPassword({ token, newPassword })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "forgot-password" or "reset-password".' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Password Reset API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleForgotPassword({ email }: { email: string }) {
  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token in database (you might want to add a resetToken field to User model)
    // For now, we'll use a simple approach with JWT
    const resetJWT = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, send via email)
    console.log('Password reset token:', resetJWT)

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetJWT : undefined
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

async function handleResetPassword({ token, newPassword }: { token: string; newPassword: string }) {
  if (!token || !newPassword) {
    return NextResponse.json(
      { error: 'Token and new password are required' },
      { status: 400 }
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long' },
      { status: 400 }
    )
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.type !== 'password-reset') {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await db.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
} 