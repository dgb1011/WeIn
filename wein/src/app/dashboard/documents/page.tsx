'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DocumentUpload from '@/components/documents/DocumentUpload'
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Award,
  BookOpen
} from 'lucide-react'

interface Document {
  id: string
  documentType: string
  fileName: string
  fileSizeBytes: number
  uploadTimestamp: string
  reviewStatus: string
  autoValidationScore?: number
  requiresManualReview: boolean
  reviewNotes?: string
  reviewedAt?: string
}

interface DocumentRequirements {
  consultationLog: { required: boolean; submitted: boolean; approved: boolean }
  evaluationForm: { required: boolean; submitted: boolean; approved: boolean }
  reflectionPaper: { required: boolean; submitted: boolean; approved: boolean }
  caseStudy: { required: boolean; submitted: boolean; approved: boolean }
  additionalRequirements: { required: boolean; submitted: boolean; approved: boolean }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirements | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDocuments()
    loadRequirements()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents?action=list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      } else {
        throw new Error('Failed to load documents')
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setError('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const loadRequirements = async () => {
    try {
      const response = await fetch('/api/documents?action=requirements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRequirements(data.requirements)
      }
    } catch (error) {
      console.error('Error loading requirements:', error)
    }
  }

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result)
    loadDocuments()
    loadRequirements()
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    setError(error)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'PENDING':
        return <Badge variant="secondary">Pending Review</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Under Review</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      case 'NEEDS_REVISION':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Needs Revision</Badge>
      case 'AUTO_APPROVED':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Auto Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'CONSULTATION_LOG': 'Consultation Log',
      'EVALUATION_FORM': 'Evaluation Form',
      'REFLECTION_PAPER': 'Reflection Paper',
      'CASE_STUDY': 'Case Study',
      'ADDITIONAL_REQUIREMENT': 'Additional Requirement'
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRequirementStatus = (requirement: any) => {
    if (requirement.approved) {
      return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: 'Completed', color: 'text-green-600' }
    } else if (requirement.submitted) {
      return { icon: <Clock className="h-5 w-5 text-yellow-500" />, text: 'Under Review', color: 'text-yellow-600' }
    } else {
      return { icon: <AlertCircle className="h-5 w-5 text-gray-400" />, text: 'Not Submitted', color: 'text-gray-500' }
    }
  }

  const getCompletionPercentage = () => {
    if (!requirements) return 0
    
    const totalRequired = Object.values(requirements).filter(r => r.required).length
    const completed = Object.values(requirements).filter(r => r.approved).length
    
    return totalRequired > 0 ? (completed / totalRequired) * 100 : 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-gray-600">Upload and manage your consultation documents</p>
        </div>
        
        <Button onClick={() => setActiveTab('upload')}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Requirements Summary */}
          {requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Document Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(requirements).map(([key, requirement]) => {
                    const status = getRequirementStatus(requirement)
                    return (
                      <div key={key} className="flex items-center space-x-3 p-4 border rounded-lg">
                        {status.icon}
                        <div>
                          <p className="font-medium">{getDocumentTypeLabel(key.toUpperCase())}</p>
                          <p className={`text-sm ${status.color}`}>{status.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm text-gray-600">{getCompletionPercentage().toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Recent Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents uploaded yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Your First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSizeBytes)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(doc.reviewStatus)}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {documents.length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('documents')}
                    >
                      View All Documents
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Documents</CardTitle>
                <Button variant="outline" size="sm" onClick={loadDocuments}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No documents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSizeBytes)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded {formatDate(doc.uploadTimestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(doc.reviewStatus)}
                        
                        {doc.autoValidationScore && (
                          <Badge variant="outline" className="text-xs">
                            Score: {doc.autoValidationScore}
                          </Badge>
                        )}
                        
                        <Button variant="ghost" size="sm" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm" title="Download">
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload 
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Document Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requirements ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(requirements).map(([key, requirement]) => {
                      const status = getRequirementStatus(requirement)
                      return (
                        <div key={key} className="p-6 border rounded-lg">
                          <div className="flex items-center space-x-3 mb-4">
                            {status.icon}
                            <div>
                              <h3 className="font-semibold">{getDocumentTypeLabel(key.toUpperCase())}</h3>
                              <p className={`text-sm ${status.color}`}>{status.text}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              {requirement.required ? 'Required for certification' : 'Optional documentation'}
                            </p>
                            
                            {!requirement.submitted && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setActiveTab('upload')}
                              >
                                Upload Document
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Document Guidelines</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• All documents should be in PDF, Word, or image format</li>
                      <li>• Maximum file size is 10MB per document</li>
                      <li>• Documents will be automatically validated and reviewed</li>
                      <li>• You'll be notified of approval or if revisions are needed</li>
                      <li>• All required documents must be approved for certification</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading requirements...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 