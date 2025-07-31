import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/services/documentService'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'list') {
      const documentType = searchParams.get('documentType')?.split(',')
      const reviewStatus = searchParams.get('reviewStatus')?.split(',')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      const documents = await DocumentService.getStudentDocuments(user.id, {
        documentType: documentType as any,
        reviewStatus: reviewStatus as any,
        limit,
        offset
      })

      return NextResponse.json({ documents })
    }

    if (action === 'requirements') {
      const requirements = await DocumentService.getDocumentRequirementsStatus(user.id)
      return NextResponse.json({ requirements })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Documents API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (action === 'upload') {
      const { documentType, fileName, fileSize, mimeType, fileData, metadata } = data

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileData, 'base64')

      const upload = {
        studentId: user.id,
        documentType,
        fileName,
        fileSize,
        mimeType,
        fileBuffer,
        metadata
      }

      const result = await DocumentService.uploadDocument(upload)
      return NextResponse.json({ result })
    }

    if (action === 'review') {
      const { documentId, status, notes, feedback } = data

      const review = {
        reviewerId: user.id,
        status,
        notes,
        feedback,
        reviewedAt: new Date()
      }

      await DocumentService.reviewDocument(documentId, review)
      return NextResponse.json({ message: 'Document reviewed successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Documents API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 