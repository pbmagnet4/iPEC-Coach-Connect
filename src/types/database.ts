/**
 * Database Type Definitions for iPEC Coach Connect
 * 
 * Auto-generated TypeScript types that match the Supabase database schema.
 * These types ensure type safety across the entire application.
 * 
 * Generated from: /supabase/migrations/20240101000000_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          location: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coaches: {
        Row: {
          id: string
          ipec_certification_number: string
          certification_level: 'Associate' | 'Professional' | 'Master'
          certification_date: string
          specializations: string[] | null
          hourly_rate: number | null
          experience_years: number | null
          languages: string[] | null
          verified_at: string | null
          is_active: boolean | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          ipec_certification_number: string
          certification_level: 'Associate' | 'Professional' | 'Master'
          certification_date: string
          specializations?: string[] | null
          hourly_rate?: number | null
          experience_years?: number | null
          languages?: string[] | null
          verified_at?: string | null
          is_active?: boolean | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ipec_certification_number?: string
          certification_level?: 'Associate' | 'Professional' | 'Master'
          certification_date?: string
          specializations?: string[] | null
          hourly_rate?: number | null
          experience_years?: number | null
          languages?: string[] | null
          verified_at?: string | null
          is_active?: boolean | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      session_types: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          created_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          coach_id: string | null
          client_id: string | null
          session_type_id: string | null
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          notes: string | null
          meeting_url: string | null
          amount_paid: number | null
          stripe_payment_intent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id?: string | null
          client_id?: string | null
          session_type_id?: string | null
          scheduled_at: string
          duration_minutes: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          meeting_url?: string | null
          amount_paid?: number | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string | null
          client_id?: string | null
          session_type_id?: string | null
          scheduled_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
          notes?: string | null
          meeting_url?: string | null
          amount_paid?: number | null
          stripe_payment_intent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          }
        ]
      }
      coach_availability: {
        Row: {
          id: string
          coach_id: string | null
          day_of_week: number | null
          start_time: string
          end_time: string
          timezone: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id?: string | null
          day_of_week?: number | null
          start_time: string
          end_time: string
          timezone?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string | null
          day_of_week?: number | null
          start_time?: string
          end_time?: string
          timezone?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean | null
          created_by: string | null
          member_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean | null
          created_by?: string | null
          member_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean | null
          created_by?: string | null
          member_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string | null
          user_id: string | null
          role: 'member' | 'moderator' | 'admin'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          user_id?: string | null
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          user_id?: string | null
          role?: 'member' | 'moderator' | 'admin'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      discussions: {
        Row: {
          id: string
          group_id: string | null
          author_id: string | null
          title: string
          content: string
          is_pinned: boolean | null
          reply_count: number | null
          last_reply_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          author_id?: string | null
          title: string
          content: string
          is_pinned?: boolean | null
          reply_count?: number | null
          last_reply_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          author_id?: string | null
          title?: string
          content?: string
          is_pinned?: boolean | null
          reply_count?: number | null
          last_reply_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      discussion_replies: {
        Row: {
          id: string
          discussion_id: string | null
          author_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discussion_id?: string | null
          author_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string | null
          author_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          is_virtual: boolean | null
          max_attendees: number | null
          current_attendees: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          is_virtual?: boolean | null
          max_attendees?: number | null
          current_attendees?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          is_virtual?: boolean | null
          max_attendees?: number | null
          current_attendees?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      event_attendees: {
        Row: {
          id: string
          event_id: string | null
          user_id: string | null
          status: 'registered' | 'attended' | 'cancelled'
          registered_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'registered' | 'attended' | 'cancelled'
          registered_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'registered' | 'attended' | 'cancelled'
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours: number | null
          is_published: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours?: number | null
          is_published?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | null
          duration_hours?: number | null
          is_published?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      }
      course_enrollments: {
        Row: {
          id: string
          course_id: string | null
          user_id: string | null
          progress_percentage: number | null
          completed_at: string | null
          enrolled_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          user_id?: string | null
          progress_percentage?: number | null
          completed_at?: string | null
          enrolled_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          user_id?: string | null
          progress_percentage?: number | null
          completed_at?: string | null
          enrolled_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: 'session' | 'payment' | 'community' | 'system' | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: 'session' | 'payment' | 'community' | 'system' | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: 'session' | 'payment' | 'community' | 'system' | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      certification_level: 'Associate' | 'Professional' | 'Master'
      session_status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
      group_role: 'member' | 'moderator' | 'admin'
      event_status: 'registered' | 'attended' | 'cancelled'
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
      notification_type: 'session' | 'payment' | 'community' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Enhanced type helpers for better developer experience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Business logic types that extend database types
export interface ProfileWithCoach extends Tables<'profiles'> {
  coach?: Tables<'coaches'> | null
}

export interface CoachWithProfile extends Tables<'coaches'> {
  profile: Tables<'profiles'>
  availability?: Tables<'coach_availability'>[]
}

export interface SessionWithDetails extends Tables<'sessions'> {
  coach?: CoachWithProfile
  client?: Tables<'profiles'>
  session_type?: Tables<'session_types'>
}

export interface DiscussionWithDetails extends Tables<'discussions'> {
  author: Tables<'profiles'>
  group?: Tables<'groups'>
  replies?: DiscussionReplyWithAuthor[]
}

export interface DiscussionReplyWithAuthor extends Tables<'discussion_replies'> {
  author: Tables<'profiles'>
}

export interface EventWithDetails extends Tables<'events'> {
  creator?: Tables<'profiles'>
  attendees?: EventAttendeeWithUser[]
}

export interface EventAttendeeWithUser extends Tables<'event_attendees'> {
  user: Tables<'profiles'>
}

export interface CourseWithDetails extends Tables<'courses'> {
  creator?: CoachWithProfile
  enrollments?: CourseEnrollmentWithUser[]
}

export interface CourseEnrollmentWithUser extends Tables<'course_enrollments'> {
  user: Tables<'profiles'>
}

// User role and permission types
export type UserRole = 'client' | 'coach' | 'admin';

export interface UserPermissions {
  canCreateSessions: boolean
  canManageCoachProfile: boolean
  canAccessAdminPanel: boolean
  canModerateContent: boolean
  canViewAnalytics: boolean
}

// API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    count?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    count: number
    page: number
    limit: number
    totalPages: number
  }
}

// Search and filter types
export interface CoachFilters {
  specializations?: string[]
  certificationLevel?: Tables<'coaches'>['certification_level'][]
  hourlyRateRange?: {
    min: number
    max: number
  }
  languages?: string[]
  location?: string
  availability?: {
    dayOfWeek?: number
    timeRange?: {
      start: string
      end: string
    }
  }
}

export interface SessionFilters {
  status?: Tables<'sessions'>['status'][]
  dateRange?: {
    start: string
    end: string
  }
  coachId?: string
  clientId?: string
}

// Utility types for form handling
export type CreateProfileData = Omit<TablesInsert<'profiles'>, 'id' | 'created_at' | 'updated_at'>
export type UpdateProfileData = Partial<CreateProfileData>

export type CreateCoachData = Omit<TablesInsert<'coaches'>, 'id' | 'created_at' | 'updated_at' | 'verified_at'>
export type UpdateCoachData = Partial<CreateCoachData>

export type CreateSessionData = Omit<TablesInsert<'sessions'>, 'id' | 'created_at' | 'updated_at'>
export type UpdateSessionData = Partial<CreateSessionData>

// Real-time subscription payload types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  schema: string
  table: string
}