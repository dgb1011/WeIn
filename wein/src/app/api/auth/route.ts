import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json()

    if (action === 'login') {
      // Login logic
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: true,
          consultant: true,
          admin: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // In a real app, you'd verify the password here
      // For now, we'll skip password verification for development
      
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType as 'STUDENT' | 'CONSULTANT' | 'ADMIN'
      })

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          student: user.student,
          consultant: user.consultant,
          admin: user.admin
        }
      })
    }

    if (action === 'register') {
      // Registration logic
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 })
      }

      const hashedPassword = await AuthService.hashPassword(password)

      const user = await prisma.user.create({
        data: {
          email,
          firstName: '', // Will be filled from form
          lastName: '', // Will be filled from form
          userType: 'STUDENT', // Default for now
          // password: hashedPassword // Add this when you add password field to schema
        },
        include: {
          student: true,
          consultant: true,
          admin: true
        }
      })

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        userType: user.userType as 'STUDENT' | 'CONSULTANT' | 'ADMIN'
      })

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          student: user.student,
          consultant: user.consultant,
          admin: user.admin
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 