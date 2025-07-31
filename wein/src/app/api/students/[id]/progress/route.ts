import { NextRequest, NextResponse } from 'next/server'
import { StudentService } from '@/lib/services/studentService'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const studentId = params.id
    
    const progress = await StudentService.getStudentProgress(studentId)
    
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student progress' },
      { status: 500 }
    )
  }
} 