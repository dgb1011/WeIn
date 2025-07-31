import { db } from '../db'

// Type definitions for document management
type DocumentType = 'CONSULTATION_LOG' | 'EVALUATION_FORM' | 'REFLECTION_PAPER' | 'CASE_STUDY' | 'ADDITIONAL_REQUIREMENT' | 'MAKEUP_DOCUMENTATION'
type ReviewStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'AUTO_APPROVED'
type ValidationStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'NEEDS_MANUAL_REVIEW'

interface DocumentUpload {
  studentId: string
  documentType: DocumentType
  fileName: string
  fileSize: number
  mimeType: string
  fileBuffer: Buffer
  metadata?: DocumentMetadata
}

interface DocumentMetadata {
  originalFilename: string
  uploadTimestamp: Date
  extractedText?: string
  validationScore?: number
  requiresManualReview: boolean
  versionNumber: number
  replacesDocumentId?: string
}

interface DocumentValidation {
  isValid: boolean
  score: number
  errors: string[]
  warnings: string[]
  extractedText: string
  requiresManualReview: boolean
  autoApproval: boolean
}

interface DocumentReview {
  documentId: string
  reviewerId: string
  status: ReviewStatus
  notes?: string
  feedback?: string
  reviewedAt: Date
}

interface DocumentProcessingResult {
  success: boolean
  documentId: string
  validationStatus: ValidationStatus
  requiresReview: boolean
  extractedText?: string
  errors?: string[]
}

export class DocumentService {
  // Document Upload and Processing
  static async uploadDocument(upload: DocumentUpload): Promise<DocumentProcessingResult> {
    try {
      // Validate file
      const fileValidation = await this.validateFile(upload)
      if (!fileValidation.isValid) {
        return {
          success: false,
          documentId: '',
          validationStatus: 'FAILED',
          requiresReview: false,
          errors: fileValidation.errors
        }
      }

      // Process document content
      const contentValidation = await this.processDocumentContent(upload)
      
      // Save to database
      const document = await db.studentDocument.create({
        data: {
          studentId: upload.studentId,
          documentType: upload.documentType,
          fileName: upload.fileName,
          fileSizeBytes: upload.fileSize,
          filePath: await this.saveFileToStorage(upload),
          mimeType: upload.mimeType,
          extractedText: contentValidation.extractedText,
          reviewStatus: contentValidation.autoApproval ? 'AUTO_APPROVED' : 'PENDING',
          autoValidationScore: contentValidation.score,
          requiresManualReview: contentValidation.requiresManualReview,
          versionNumber: await this.getNextVersionNumber(upload.studentId, upload.documentType),
          replacesDocumentId: upload.metadata?.replacesDocumentId
        }
      })

      // Update student progress if document is auto-approved
      if (contentValidation.autoApproval) {
        await this.updateDocumentProgress(upload.studentId, upload.documentType)
      }

      // Send notifications
      await this.sendDocumentNotifications(document.id, upload.studentId, contentValidation)

      return {
        success: true,
        documentId: document.id,
        validationStatus: contentValidation.autoApproval ? 'PASSED' : 'NEEDS_MANUAL_REVIEW',
        requiresReview: contentValidation.requiresManualReview,
        extractedText: contentValidation.extractedText,
        errors: contentValidation.errors
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      throw new Error('Failed to upload document')
    }
  }

  // File Validation
  private static async validateFile(upload: DocumentUpload): Promise<DocumentValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (upload.fileSize > maxSize) {
      errors.push('File size exceeds maximum limit of 10MB')
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
    
    if (!allowedTypes.includes(upload.mimeType)) {
      errors.push('File type not supported. Please upload PDF, Word, or image files.')
    }

    // Check file name
    if (upload.fileName.length > 255) {
      errors.push('File name is too long')
    }

    // Virus scan (mock implementation)
    const virusScanResult = await this.scanForVirus(upload.fileBuffer)
    if (!virusScanResult.isClean) {
      errors.push('File failed security scan')
    }

    return {
      isValid: errors.length === 0,
      score: errors.length === 0 ? 100 : 0,
      errors,
      warnings,
      extractedText: '',
      requiresManualReview: errors.length > 0,
      autoApproval: errors.length === 0
    }
  }

  // Document Content Processing
  private static async processDocumentContent(upload: DocumentUpload): Promise<DocumentValidation> {
    try {
      // Extract text using OCR for images or extract from PDF/Word
      const extractedText = await this.extractText(upload)
      
      // Validate content based on document type
      const contentValidation = await this.validateContent(extractedText, upload.documentType)
      
      // Calculate validation score
      const score = this.calculateValidationScore(contentValidation)
      
      // Determine if manual review is required
      const requiresManualReview = score < 70 || contentValidation.errors.length > 0
      const autoApproval = score >= 90 && contentValidation.errors.length === 0

      return {
        isValid: contentValidation.errors.length === 0,
        score,
        errors: contentValidation.errors,
        warnings: contentValidation.warnings,
        extractedText,
        requiresManualReview,
        autoApproval
      }
    } catch (error) {
      console.error('Error processing document content:', error)
      return {
        isValid: false,
        score: 0,
        errors: ['Failed to process document content'],
        warnings: [],
        extractedText: '',
        requiresManualReview: true,
        autoApproval: false
      }
    }
  }

  // Text Extraction
  private static async extractText(upload: DocumentUpload): Promise<string> {
    // Mock OCR implementation - in production, this would use a real OCR service
    if (upload.mimeType.startsWith('image/')) {
      // Mock OCR for images
      return `Extracted text from ${upload.fileName} - This is a mock OCR result. In production, this would contain the actual extracted text from the image.`
    } else if (upload.mimeType === 'application/pdf') {
      // Mock PDF text extraction
      return `Extracted text from PDF ${upload.fileName} - This is a mock PDF extraction result. In production, this would contain the actual text from the PDF.`
    } else if (upload.mimeType.includes('wordprocessingml') || upload.mimeType === 'application/msword') {
      // Mock Word document text extraction
      return `Extracted text from Word document ${upload.fileName} - This is a mock Word extraction result. In production, this would contain the actual text from the Word document.`
    } else {
      // For text files, return the buffer as string
      return upload.fileBuffer.toString('utf-8')
    }
  }

  // Content Validation
  private static async validateContent(text: string, documentType: DocumentType): Promise<DocumentValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic content validation
    if (!text || text.trim().length < 50) {
      errors.push('Document content is too short. Minimum 50 characters required.')
    }

    if (text.length > 50000) {
      warnings.push('Document is very long. Consider breaking it into smaller sections.')
    }

    // Document type specific validation
    switch (documentType) {
      case 'CONSULTATION_LOG':
        if (!text.toLowerCase().includes('consultation') && !text.toLowerCase().includes('session')) {
          errors.push('Consultation log should contain information about consultation sessions.')
        }
        break
      
      case 'EVALUATION_FORM':
        if (!text.toLowerCase().includes('evaluation') && !text.toLowerCase().includes('assessment')) {
          errors.push('Evaluation form should contain evaluation or assessment information.')
        }
        break
      
      case 'REFLECTION_PAPER':
        if (!text.toLowerCase().includes('reflection') && !text.toLowerCase().includes('learning')) {
          warnings.push('Reflection paper should contain personal reflections and learning insights.')
        }
        break
      
      case 'CASE_STUDY':
        if (!text.toLowerCase().includes('case') && !text.toLowerCase().includes('client')) {
          errors.push('Case study should contain case or client information.')
        }
        break
    }

    // Check for required keywords based on document type
    const requiredKeywords = this.getRequiredKeywords(documentType)
    const missingKeywords = requiredKeywords.filter(keyword => 
      !text.toLowerCase().includes(keyword.toLowerCase())
    )

    if (missingKeywords.length > 0) {
      warnings.push(`Consider including: ${missingKeywords.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      score: this.calculateContentScore(text, errors, warnings),
      errors,
      warnings,
      extractedText: text,
      requiresManualReview: errors.length > 0 || warnings.length > 2,
      autoApproval: errors.length === 0 && warnings.length <= 1
    }
  }

  // Get required keywords for document types
  private static getRequiredKeywords(documentType: DocumentType): string[] {
    switch (documentType) {
      case 'CONSULTATION_LOG':
        return ['consultation', 'session', 'client', 'progress', 'notes']
      case 'EVALUATION_FORM':
        return ['evaluation', 'assessment', 'feedback', 'rating']
      case 'REFLECTION_PAPER':
        return ['reflection', 'learning', 'experience', 'insight']
      case 'CASE_STUDY':
        return ['case', 'client', 'intervention', 'outcome']
      default:
        return []
    }
  }

  // Calculate validation score
  private static calculateValidationScore(validation: DocumentValidation): number {
    let score = 100

    // Deduct points for errors
    score -= validation.errors.length * 20

    // Deduct points for warnings
    score -= validation.warnings.length * 5

    // Bonus for good content length
    if (validation.extractedText.length > 500) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  // Calculate content score
  private static calculateContentScore(text: string, errors: string[], warnings: string[]): number {
    let score = 100

    // Deduct for errors
    score -= errors.length * 25

    // Deduct for warnings
    score -= warnings.length * 5

    // Bonus for good content length
    if (text.length > 1000) {
      score += 10
    }

    // Bonus for good structure
    if (text.includes('\n\n') || text.includes('  ')) {
      score += 5
    }

    return Math.max(0, Math.min(100, score))
  }

  // Document Review Management
  static async reviewDocument(documentId: string, review: Omit<DocumentReview, 'documentId'>): Promise<void> {
    try {
      // Update document review status
      await db.studentDocument.update({
        where: { id: documentId },
        data: {
          reviewStatus: review.status,
          reviewedBy: review.reviewerId,
          reviewedAt: review.reviewedAt,
          reviewNotes: review.notes
        }
      })

      // If approved, update student progress
      if (review.status === 'APPROVED') {
        const document = await db.studentDocument.findUnique({
          where: { id: documentId }
        })
        
        if (document) {
          await this.updateDocumentProgress(document.studentId, document.documentType)
        }
      }

      // Send review notifications
      await this.sendReviewNotifications(documentId, review)
    } catch (error) {
      console.error('Error reviewing document:', error)
      throw new Error('Failed to review document')
    }
  }

  // Get student documents
  static async getStudentDocuments(
    studentId: string,
    filters?: {
      documentType?: DocumentType[]
      reviewStatus?: ReviewStatus[]
      limit?: number
      offset?: number
    }
  ) {
    try {
      const whereClause: any = { studentId }

      if (filters?.documentType && filters.documentType.length > 0) {
        whereClause.documentType = { in: filters.documentType }
      }

      if (filters?.reviewStatus && filters.reviewStatus.length > 0) {
        whereClause.reviewStatus = { in: filters.reviewStatus }
      }

      const documents = await db.studentDocument.findMany({
        where: whereClause,
        orderBy: { uploadTimestamp: 'desc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0
      })

      return documents
    } catch (error) {
      console.error('Error getting student documents:', error)
      throw new Error('Failed to get student documents')
    }
  }

  // Get document requirements status
  static async getDocumentRequirementsStatus(studentId: string) {
    try {
      const documents = await this.getStudentDocuments(studentId)
      
      const requirements = {
        consultationLog: { required: true, submitted: false, approved: false },
        evaluationForm: { required: true, submitted: false, approved: false },
        reflectionPaper: { required: true, submitted: false, approved: false },
        caseStudy: { required: true, submitted: false, approved: false },
        additionalRequirements: { required: false, submitted: false, approved: false }
      }

      documents.forEach(doc => {
        const key = doc.documentType.toLowerCase().replace('_', '') as keyof typeof requirements
        if (requirements[key]) {
          requirements[key].submitted = true
          requirements[key].approved = doc.reviewStatus === 'APPROVED'
        }
      })

      return requirements
    } catch (error) {
      console.error('Error getting document requirements status:', error)
      throw new Error('Failed to get document requirements status')
    }
  }

  // Update document progress
  private static async updateDocumentProgress(studentId: string, documentType: DocumentType) {
    // This would integrate with the progress service to update document completion
    console.log(`Document progress updated for student ${studentId}, document type: ${documentType}`)
  }

  // Helper methods
  private static async saveFileToStorage(upload: DocumentUpload): Promise<string> {
    // Mock file storage - in production, this would save to cloud storage
    const fileName = `${upload.studentId}/${Date.now()}_${upload.fileName}`
    return `/uploads/${fileName}`
  }

  private static async getNextVersionNumber(studentId: string, documentType: DocumentType): Promise<number> {
    const existingDocs = await db.studentDocument.findMany({
      where: {
        studentId,
        documentType
      },
      orderBy: { versionNumber: 'desc' },
      take: 1
    })

    return existingDocs.length > 0 ? existingDocs[0].versionNumber + 1 : 1
  }

  private static async scanForVirus(fileBuffer: Buffer): Promise<{ isClean: boolean }> {
    // Mock virus scan - in production, this would use a real virus scanning service
    return { isClean: true }
  }

  private static async sendDocumentNotifications(
    documentId: string,
    studentId: string,
    validation: DocumentValidation
  ) {
    // Mock notification - in production, this would send emails/notifications
    console.log(`Document notifications sent for document ${documentId}`)
  }

  private static async sendReviewNotifications(documentId: string, review: Omit<DocumentReview, 'documentId'>) {
    // Mock notification - in production, this would send emails/notifications
    console.log(`Review notifications sent for document ${documentId}`)
  }
} 