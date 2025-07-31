'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  File,
  Image,
  FileType
} from 'lucide-react'

interface DocumentUploadProps {
  onUploadComplete?: (result: any) => void
  onUploadError?: (error: string) => void
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
  result?: any
}

type DocumentType = 'CONSULTATION_LOG' | 'EVALUATION_FORM' | 'REFLECTION_PAPER' | 'CASE_STUDY' | 'ADDITIONAL_REQUIREMENT'

const DOCUMENT_TYPES = [
  { value: 'CONSULTATION_LOG', label: 'Consultation Log', description: 'Log of consultation sessions and notes' },
  { value: 'EVALUATION_FORM', label: 'Evaluation Form', description: 'Formal evaluation and assessment documents' },
  { value: 'REFLECTION_PAPER', label: 'Reflection Paper', description: 'Personal reflections and learning insights' },
  { value: 'CASE_STUDY', label: 'Case Study', description: 'Detailed case studies and client information' },
  { value: 'ADDITIONAL_REQUIREMENT', label: 'Additional Requirement', description: 'Other required documentation' }
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png'
]

export default function DocumentUpload({ onUploadComplete, onUploadError }: DocumentUploadProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('CONSULTATION_LOG')
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true
  })

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // Convert file to base64
      const base64 = await fileToBase64(uploadFile.file)

      // Prepare upload data
      const uploadData = {
        action: 'upload',
        documentType: selectedDocumentType,
        fileName: uploadFile.file.name,
        fileSize: uploadFile.file.size,
        mimeType: uploadFile.file.type,
        fileData: base64.split(',')[1], // Remove data URL prefix
        metadata: {
          originalFilename: uploadFile.file.name,
          uploadTimestamp: new Date().toISOString()
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 }
          }
          return f
        }))
      }, 200)

      // Upload to API
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(uploadData)
      })

      clearInterval(progressInterval)

      if (response.ok) {
        const result = await response.json()
        
        // Update status to completed
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            result: result.result 
          } : f
        ))

        onUploadComplete?.(result.result)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      // Update status to error
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : f
      ))

      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const uploadAllFiles = async () => {
    if (uploadFiles.length === 0) return
    
    setIsUploading(true)
    
    try {
      // Upload files sequentially
      for (const file of uploadFiles.filter(f => f.status === 'pending')) {
        await uploadFile(file)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryUpload = async (fileId: string) => {
    const file = uploadFiles.find(f => f.id === fileId)
    if (file) {
      await uploadFile(file)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5" />
    } else if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') {
      return <FileType className="h-5 w-5" />
    } else {
      return <File className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
  const completedFiles = uploadFiles.filter(f => f.status === 'completed')
  const errorFiles = uploadFiles.filter(f => f.status === 'error')

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Document Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentType">Select Document Type</Label>
              <Select value={selectedDocumentType} onValueChange={(value: DocumentType) => setSelectedDocumentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : isDragReject 
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-600">
                Drop the files here...
              </p>
            ) : isDragReject ? (
              <p className="text-lg font-medium text-red-600">
                Some files will be rejected
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF, Word, text, and image files (max 10MB each)
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {pendingFiles.length > 0 && (
            <div className="mt-4">
              <Button 
                onClick={uploadAllFiles} 
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingFiles.length} File{pendingFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadFiles.map(uploadFile => (
                <div key={uploadFile.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getFileIcon(uploadFile.file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploadFile.status)}
                        
                        {uploadFile.status === 'error' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryUpload(uploadFile.id)}
                          >
                            Retry
                          </Button>
                        )}
                        
                        {uploadFile.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {(uploadFile.status === 'uploading' || uploadFile.status === 'completed') && (
                      <div className="mt-2">
                        <Progress value={uploadFile.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadFile.progress}% complete
                        </p>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-sm text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                    
                    {/* Success Message */}
                    {uploadFile.status === 'completed' && uploadFile.result && (
                      <div className="mt-2">
                        <Badge variant="default" className="text-xs">
                          {uploadFile.result.validationStatus}
                        </Badge>
                        {uploadFile.result.requiresReview && (
                          <p className="text-xs text-yellow-600 mt-1">
                            Manual review required
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Summary */}
      {uploadFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{pendingFiles.length}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{completedFiles.length}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{errorFiles.length}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {errorFiles.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorFiles.length} file{errorFiles.length > 1 ? 's' : ''} failed to upload. 
            You can retry individual files or remove them and try again.
          </AlertDescription>
        </Alert>
      )}

      {completedFiles.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully uploaded {completedFiles.length} file{completedFiles.length > 1 ? 's' : ''}. 
            {completedFiles.some(f => f.result?.requiresReview) && 
              ' Some files require manual review before approval.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 