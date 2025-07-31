import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/studentService'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const studentId = params.id
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const sessions = await StudentService.getStudentSessions(studentId, {
      status: status as any,
      limit,
      offset
    })
    
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching student sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student sessions' },
      { status: 500 }
    )
  }
} 