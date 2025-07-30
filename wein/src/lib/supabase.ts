import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types for type safety
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          firstName: string
          lastName: string
          userType: 'STUDENT' | 'CONSULTANT' | 'ADMIN'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          firstName: string
          lastName: string
          userType: 'STUDENT' | 'CONSULTANT' | 'ADMIN'
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          firstName?: string
          lastName?: string
          userType?: 'STUDENT' | 'CONSULTANT' | 'ADMIN'
          createdAt?: string
          updatedAt?: string
        }
      }
      students: {
        Row: {
          id: string
          userId: string
          kajabiUserId: string
          courseCompletionDate: string
          totalVerifiedHours: number
          totalVideoHours: number
          certificationStatus: string
          preferredSessionLength: number
          consultationPreferences: any
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          kajabiUserId: string
          courseCompletionDate: string
          totalVerifiedHours?: number
          totalVideoHours?: number
          certificationStatus?: string
          preferredSessionLength?: number
          consultationPreferences?: any
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          kajabiUserId?: string
          courseCompletionDate?: string
          totalVerifiedHours?: number
          totalVideoHours?: number
          certificationStatus?: string
          preferredSessionLength?: number
          consultationPreferences?: any
          createdAt?: string
          updatedAt?: string
        }
      }
      consultants: {
        Row: {
          id: string
          userId: string
          bio: string
          specialties: string[]
          hourlyRate: number
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          bio: string
          specialties: string[]
          hourlyRate: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          bio?: string
          specialties?: string[]
          hourlyRate?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      consultation_sessions: {
        Row: {
          id: string
          studentId: string
          consultantId: string
          scheduledStart: string
          scheduledEnd: string
          actualStart: string | null
          actualEnd: string | null
          status: string
          sessionType: string
          videoSessionId: string | null
          studentVerifiedAt: string | null
          consultantVerifiedAt: string | null
          studentNotes: string | null
          consultantNotes: string | null
          sessionRating: number | null
          technicalIssuesReported: boolean
          makeupSessionFor: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          studentId: string
          consultantId: string
          scheduledStart: string
          scheduledEnd: string
          actualStart?: string | null
          actualEnd?: string | null
          status?: string
          sessionType?: string
          videoSessionId?: string | null
          studentVerifiedAt?: string | null
          consultantVerifiedAt?: string | null
          studentNotes?: string | null
          consultantNotes?: string | null
          sessionRating?: number | null
          technicalIssuesReported?: boolean
          makeupSessionFor?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          studentId?: string
          consultantId?: string
          scheduledStart?: string
          scheduledEnd?: string
          actualStart?: string | null
          actualEnd?: string | null
          status?: string
          sessionType?: string
          videoSessionId?: string | null
          studentVerifiedAt?: string | null
          consultantVerifiedAt?: string | null
          studentNotes?: string | null
          consultantNotes?: string | null
          sessionRating?: number | null
          technicalIssuesReported?: boolean
          makeupSessionFor?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 