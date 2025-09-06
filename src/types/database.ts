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
          mfa_enabled: boolean | null
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
          mfa_enabled?: boolean | null
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
          mfa_enabled?: boolean | null
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
      coach_payment_settings: {
        Row: {
          id: string
          coach_id: string
          payout_enabled: boolean
          commission_rate: number
          currency: string
          payout_schedule: string
          minimum_payout: number
          stripe_account_id: string | null
          bank_account_verified: boolean
          tax_info_collected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          payout_enabled?: boolean
          commission_rate?: number
          currency?: string
          payout_schedule?: string
          minimum_payout?: number
          stripe_account_id?: string | null
          bank_account_verified?: boolean
          tax_info_collected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          payout_enabled?: boolean
          commission_rate?: number
          currency?: string
          payout_schedule?: string
          minimum_payout?: number
          stripe_account_id?: string | null
          bank_account_verified?: boolean
          tax_info_collected?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_payment_settings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      }
      revenue_records: {
        Row: {
          id: string
          session_id: string | null
          coach_id: string
          payment_intent_id: string | null
          gross_amount: number
          platform_commission: number
          coach_amount: number
          currency: string
          processed_at: string
          coach_payout_status: string
          payout_batch_id: string | null
          payout_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          coach_id: string
          payment_intent_id?: string | null
          gross_amount: number
          platform_commission: number
          coach_amount: number
          currency?: string
          processed_at?: string
          coach_payout_status?: string
          payout_batch_id?: string | null
          payout_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          coach_id?: string
          payment_intent_id?: string | null
          gross_amount?: number
          platform_commission?: number
          coach_amount?: number
          currency?: string
          processed_at?: string
          coach_payout_status?: string
          payout_batch_id?: string | null
          payout_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_records_coach_id_fkey"
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
          slug: string
          description: string | null
          detailed_description: string | null
          event_type: 'webinar' | 'workshop' | 'conference' | 'seminar' | 'meetup' | 'certification'
          event_format: 'in-person' | 'virtual' | 'hybrid'
          start_time: string
          end_time: string
          timezone: string
          location: string | null
          virtual_meeting_url: string | null
          image_url: string | null
          banner_image_url: string | null
          price: number | null
          currency: string
          is_free: boolean
          max_attendees: number | null
          current_attendees: number | null
          registration_deadline: string | null
          prerequisites: string[] | null
          learning_objectives: string[] | null
          agenda: Json | null
          materials_provided: string[] | null
          target_audience: string[] | null
          certification_hours: number | null
          tags: string[] | null
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          featured: boolean
          registration_enabled: boolean
          waitlist_enabled: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          detailed_description?: string | null
          event_type: 'webinar' | 'workshop' | 'conference' | 'seminar' | 'meetup' | 'certification'
          event_format: 'in-person' | 'virtual' | 'hybrid'
          start_time: string
          end_time: string
          timezone?: string
          location?: string | null
          virtual_meeting_url?: string | null
          image_url?: string | null
          banner_image_url?: string | null
          price?: number | null
          currency?: string
          is_free?: boolean
          max_attendees?: number | null
          current_attendees?: number | null
          registration_deadline?: string | null
          prerequisites?: string[] | null
          learning_objectives?: string[] | null
          agenda?: Json | null
          materials_provided?: string[] | null
          target_audience?: string[] | null
          certification_hours?: number | null
          tags?: string[] | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          featured?: boolean
          registration_enabled?: boolean
          waitlist_enabled?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          detailed_description?: string | null
          event_type?: 'webinar' | 'workshop' | 'conference' | 'seminar' | 'meetup' | 'certification'
          event_format?: 'in-person' | 'virtual' | 'hybrid'
          start_time?: string
          end_time?: string
          timezone?: string
          location?: string | null
          virtual_meeting_url?: string | null
          image_url?: string | null
          banner_image_url?: string | null
          price?: number | null
          currency?: string
          is_free?: boolean
          max_attendees?: number | null
          current_attendees?: number | null
          registration_deadline?: string | null
          prerequisites?: string[] | null
          learning_objectives?: string[] | null
          agenda?: Json | null
          materials_provided?: string[] | null
          target_audience?: string[] | null
          certification_hours?: number | null
          tags?: string[] | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          featured?: boolean
          registration_enabled?: boolean
          waitlist_enabled?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
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
          status: 'registered' | 'waitlisted' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'refunded'
          registration_type: 'regular' | 'early_bird' | 'group' | 'complimentary'
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'free'
          amount_paid: number | null
          stripe_payment_intent_id: string | null
          special_requirements: string | null
          dietary_restrictions: string[] | null
          emergency_contact: Json | null
          registration_questions: Json | null
          check_in_time: string | null
          feedback_rating: number | null
          feedback_comment: string | null
          certificate_issued: boolean
          certificate_url: string | null
          registered_at: string
          confirmed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'registered' | 'waitlisted' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'refunded'
          registration_type?: 'regular' | 'early_bird' | 'group' | 'complimentary'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'free'
          amount_paid?: number | null
          stripe_payment_intent_id?: string | null
          special_requirements?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact?: Json | null
          registration_questions?: Json | null
          check_in_time?: string | null
          feedback_rating?: number | null
          feedback_comment?: string | null
          certificate_issued?: boolean
          certificate_url?: string | null
          registered_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string | null
          user_id?: string | null
          status?: 'registered' | 'waitlisted' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'refunded'
          registration_type?: 'regular' | 'early_bird' | 'group' | 'complimentary'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'free'
          amount_paid?: number | null
          stripe_payment_intent_id?: string | null
          special_requirements?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact?: Json | null
          registration_questions?: Json | null
          check_in_time?: string | null
          feedback_rating?: number | null
          feedback_comment?: string | null
          certificate_issued?: boolean
          certificate_url?: string | null
          registered_at?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
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
      mfa_settings: {
        Row: {
          id: string
          user_id: string
          mfa_enabled: boolean | null
          mfa_enforced: boolean | null
          primary_method: 'totp' | 'sms' | 'email' | null
          backup_method: 'totp' | 'sms' | 'email' | null
          last_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mfa_enabled?: boolean | null
          mfa_enforced?: boolean | null
          primary_method?: 'totp' | 'sms' | 'email' | null
          backup_method?: 'totp' | 'sms' | 'email' | null
          last_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mfa_enabled?: boolean | null
          mfa_enforced?: boolean | null
          primary_method?: 'totp' | 'sms' | 'email' | null
          backup_method?: 'totp' | 'sms' | 'email' | null
          last_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_totp_secrets: {
        Row: {
          id: string
          user_id: string
          encrypted_secret: string
          recovery_codes: string[] | null
          status: 'pending' | 'active' | 'disabled'
          verified_at: string | null
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_secret: string
          recovery_codes?: string[] | null
          status?: 'pending' | 'active' | 'disabled'
          verified_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_secret?: string
          recovery_codes?: string[] | null
          status?: 'pending' | 'active' | 'disabled'
          verified_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_totp_secrets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_backup_codes: {
        Row: {
          id: string
          user_id: string
          code_hash: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code_hash: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code_hash?: string
          used_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_backup_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_devices: {
        Row: {
          id: string
          user_id: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          browser_info: Json | null
          ip_address: string | null
          trust_status: 'trusted' | 'untrusted' | 'revoked'
          trusted_at: string | null
          trust_expires_at: string | null
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          browser_info?: Json | null
          ip_address?: string | null
          trust_status?: 'trusted' | 'untrusted' | 'revoked'
          trusted_at?: string | null
          trust_expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          browser_info?: Json | null
          ip_address?: string | null
          trust_status?: 'trusted' | 'untrusted' | 'revoked'
          trusted_at?: string | null
          trust_expires_at?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_audit_log: {
        Row: {
          id: string
          user_id: string
          event_type: string
          method: 'totp' | 'sms' | 'email' | null
          ip_address: string | null
          user_agent: string | null
          device_fingerprint: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          method?: 'totp' | 'sms' | 'email' | null
          ip_address?: string | null
          user_agent?: string | null
          device_fingerprint?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          method?: 'totp' | 'sms' | 'email' | null
          ip_address?: string | null
          user_agent?: string | null
          device_fingerprint?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_verification_attempts: {
        Row: {
          id: string
          user_id: string
          method: 'totp' | 'sms' | 'email'
          ip_address: string | null
          device_fingerprint: string | null
          success: boolean | null
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          method: 'totp' | 'sms' | 'email'
          ip_address?: string | null
          device_fingerprint?: string | null
          success?: boolean | null
          attempted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          method?: 'totp' | 'sms' | 'email'
          ip_address?: string | null
          device_fingerprint?: string | null
          success?: boolean | null
          attempted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_verification_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coach_applications: {
        Row: {
          id: string
          user_id: string
          status: 'draft' | 'submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'approved' | 'rejected' | 'withdrawn'
          first_name: string
          last_name: string
          email: string
          phone: string
          ipec_certification_number: string
          certification_level: 'Associate' | 'Professional' | 'Master'
          certification_date: string
          experience_years: number
          hourly_rate: number | null
          bio: string
          specializations: string[]
          languages: string[]
          website: string | null
          linkedin_url: string | null
          cover_letter: string
          motivation: string | null
          additional_notes: string | null
          referral_source: string | null
          reviewer_id: string | null
          review_notes: string | null
          rejection_reason: string | null
          approval_date: string | null
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'draft' | 'submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'approved' | 'rejected' | 'withdrawn'
          first_name: string
          last_name: string
          email: string
          phone: string
          ipec_certification_number: string
          certification_level: 'Associate' | 'Professional' | 'Master'
          certification_date: string
          experience_years: number
          hourly_rate?: number | null
          bio: string
          specializations?: string[]
          languages?: string[]
          website?: string | null
          linkedin_url?: string | null
          cover_letter: string
          motivation?: string | null
          additional_notes?: string | null
          referral_source?: string | null
          reviewer_id?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          approval_date?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'draft' | 'submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'approved' | 'rejected' | 'withdrawn'
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          ipec_certification_number?: string
          certification_level?: 'Associate' | 'Professional' | 'Master'
          certification_date?: string
          experience_years?: number
          hourly_rate?: number | null
          bio?: string
          specializations?: string[]
          languages?: string[]
          website?: string | null
          linkedin_url?: string | null
          cover_letter?: string
          motivation?: string | null
          additional_notes?: string | null
          referral_source?: string | null
          reviewer_id?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          approval_date?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_documents: {
        Row: {
          id: string
          application_id: string
          document_type: 'resume' | 'certification' | 'identity' | 'insurance' | 'portfolio' | 'reference_letter' | 'additional'
          document_name: string
          file_path: string
          file_size: number
          mime_type: string
          verification_status: 'pending' | 'verified' | 'rejected' | 'expired'
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          is_required: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          document_type: 'resume' | 'certification' | 'identity' | 'insurance' | 'portfolio' | 'reference_letter' | 'additional'
          document_name: string
          file_path: string
          file_size: number
          mime_type: string
          verification_status?: 'pending' | 'verified' | 'rejected' | 'expired'
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          is_required?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          document_type?: 'resume' | 'certification' | 'identity' | 'insurance' | 'portfolio' | 'reference_letter' | 'additional'
          document_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          verification_status?: 'pending' | 'verified' | 'rejected' | 'expired'
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          is_required?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_references: {
        Row: {
          id: string
          application_id: string
          name: string
          email: string
          phone: string | null
          relationship: string
          organization: string | null
          contact_status: 'pending' | 'contacted' | 'responded' | 'unavailable'
          contacted_at: string | null
          responded_at: string | null
          rating: number | null
          comments: string | null
          would_recommend: boolean | null
          is_verified: boolean
          verification_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          name: string
          email: string
          phone?: string | null
          relationship: string
          organization?: string | null
          contact_status?: 'pending' | 'contacted' | 'responded' | 'unavailable'
          contacted_at?: string | null
          responded_at?: string | null
          rating?: number | null
          comments?: string | null
          would_recommend?: boolean | null
          is_verified?: boolean
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          name?: string
          email?: string
          phone?: string | null
          relationship?: string
          organization?: string | null
          contact_status?: 'pending' | 'contacted' | 'responded' | 'unavailable'
          contacted_at?: string | null
          responded_at?: string | null
          rating?: number | null
          comments?: string | null
          would_recommend?: boolean | null
          is_verified?: boolean
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          }
        ]
      }
      application_reviews: {
        Row: {
          id: string
          application_id: string
          reviewer_id: string
          review_type: 'initial' | 'documents' | 'references' | 'interview' | 'final'
          decision: 'approve' | 'reject' | 'request_info' | 'schedule_interview' | null
          credentials_rating: number | null
          experience_rating: number | null
          communication_rating: number | null
          professionalism_rating: number | null
          overall_rating: number | null
          strengths: string | null
          concerns: string | null
          recommendations: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          reviewer_id: string
          review_type: 'initial' | 'documents' | 'references' | 'interview' | 'final'
          decision?: 'approve' | 'reject' | 'request_info' | 'schedule_interview' | null
          credentials_rating?: number | null
          experience_rating?: number | null
          communication_rating?: number | null
          professionalism_rating?: number | null
          overall_rating?: number | null
          strengths?: string | null
          concerns?: string | null
          recommendations?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          reviewer_id?: string
          review_type?: 'initial' | 'documents' | 'references' | 'interview' | 'final'
          decision?: 'approve' | 'reject' | 'request_info' | 'schedule_interview' | null
          credentials_rating?: number | null
          experience_rating?: number | null
          communication_rating?: number | null
          professionalism_rating?: number | null
          overall_rating?: number | null
          strengths?: string | null
          concerns?: string | null
          recommendations?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_interviews: {
        Row: {
          id: string
          application_id: string
          interviewer_id: string
          scheduled_at: string
          duration_minutes: number
          meeting_url: string | null
          meeting_platform: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          conducted_at: string | null
          coaching_skills_rating: number | null
          communication_rating: number | null
          culture_fit_rating: number | null
          technical_rating: number | null
          overall_rating: number | null
          notes: string | null
          recommendation: 'hire' | 'reject' | 'second_interview' | null
          next_steps: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          interviewer_id: string
          scheduled_at: string
          duration_minutes?: number
          meeting_url?: string | null
          meeting_platform?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          conducted_at?: string | null
          coaching_skills_rating?: number | null
          communication_rating?: number | null
          culture_fit_rating?: number | null
          technical_rating?: number | null
          overall_rating?: number | null
          notes?: string | null
          recommendation?: 'hire' | 'reject' | 'second_interview' | null
          next_steps?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          interviewer_id?: string
          scheduled_at?: string
          duration_minutes?: number
          meeting_url?: string | null
          meeting_platform?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
          conducted_at?: string | null
          coaching_skills_rating?: number | null
          communication_rating?: number | null
          culture_fit_rating?: number | null
          technical_rating?: number | null
          overall_rating?: number | null
          notes?: string | null
          recommendation?: 'hire' | 'reject' | 'second_interview' | null
          next_steps?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_status_history: {
        Row: {
          id: string
          application_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          change_reason: string | null
          notes: string | null
          automated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          change_reason?: string | null
          notes?: string | null
          automated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          change_reason?: string | null
          notes?: string | null
          automated?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      application_notifications: {
        Row: {
          id: string
          application_id: string
          recipient_id: string
          type: 'application_submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'interview_reminder' | 'approved' | 'rejected' | 'additional_info_needed' | 'reference_request'
          title: string
          message: string
          delivery_method: 'email' | 'sms' | 'in_app' | 'all'
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          email_subject: string | null
          email_template: string | null
          sms_message: string | null
          priority: number
          retry_count: number
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          recipient_id: string
          type: 'application_submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'interview_reminder' | 'approved' | 'rejected' | 'additional_info_needed' | 'reference_request'
          title: string
          message: string
          delivery_method?: 'email' | 'sms' | 'in_app' | 'all'
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          sms_message?: string | null
          priority?: number
          retry_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          recipient_id?: string
          type?: 'application_submitted' | 'under_review' | 'documents_requested' | 'interview_scheduled' | 'interview_reminder' | 'approved' | 'rejected' | 'additional_info_needed' | 'reference_request'
          title?: string
          message?: string
          delivery_method?: 'email' | 'sms' | 'in_app' | 'all'
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          email_subject?: string | null
          email_template?: string | null
          sms_message?: string | null
          priority?: number
          retry_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_review_queues: {
        Row: {
          id: string
          application_id: string
          assigned_to: string | null
          queue_type: 'initial_review' | 'document_verification' | 'reference_check' | 'interview_scheduling' | 'final_approval'
          priority: number
          status: 'pending' | 'in_progress' | 'completed' | 'escalated'
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          estimated_hours: number
          actual_hours: number | null
          complexity_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          assigned_to?: string | null
          queue_type: 'initial_review' | 'document_verification' | 'reference_check' | 'interview_scheduling' | 'final_approval'
          priority?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'escalated'
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_hours?: number
          actual_hours?: number | null
          complexity_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          assigned_to?: string | null
          queue_type?: 'initial_review' | 'document_verification' | 'reference_check' | 'interview_scheduling' | 'final_approval'
          priority?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'escalated'
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          estimated_hours?: number
          actual_hours?: number | null
          complexity_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_review_queues_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "coach_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_review_queues_assigned_to_fkey"
            columns: ["assigned_to"]
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
      conversations: {
        Row: {
          id: string
          participants: string[]
          last_message_id: string | null
          last_message_at: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participants: string[]
          last_message_id?: string | null
          last_message_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participants?: string[]
          last_message_id?: string | null
          last_message_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversations_last_message"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          message_type: 'text' | 'file' | 'image' | 'system'
          file_url: string | null
          file_name: string | null
          file_size: number | null
          read_at: string | null
          edited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          message_type?: 'text' | 'file' | 'image' | 'system'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          read_at?: string | null
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          message_type?: 'text' | 'file' | 'image' | 'system'
          file_url?: string | null
          file_name?: string | null
          file_size?: number | null
          read_at?: string | null
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      typing_indicators: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          is_typing: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          is_typing?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          is_typing?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_presence: {
        Row: {
          user_id: string
          is_online: boolean
          last_seen: string
          updated_at: string
        }
        Insert: {
          user_id: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          is_online?: boolean
          last_seen?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
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
      event_status: 'registered' | 'waitlisted' | 'confirmed' | 'attended' | 'no_show' | 'cancelled' | 'refunded'
      event_type: 'webinar' | 'workshop' | 'conference' | 'seminar' | 'meetup' | 'certification'
      event_format: 'in-person' | 'virtual' | 'hybrid'
      event_publication_status: 'draft' | 'published' | 'cancelled' | 'completed'
      registration_type: 'regular' | 'early_bird' | 'group' | 'complimentary'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'free'
      difficulty_level: 'beginner' | 'intermediate' | 'advanced'
      notification_type: 'session' | 'payment' | 'community' | 'system' | 'event'
      mfa_method: 'totp' | 'sms' | 'email'
      mfa_status: 'pending' | 'active' | 'disabled'
      device_trust_status: 'trusted' | 'untrusted' | 'revoked'
      message_type: 'text' | 'file' | 'image' | 'system'
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
  speakers?: EventSpeaker[]
  waitlist_count?: number
  available_spots?: number
  is_sold_out?: boolean
  is_registration_open?: boolean
}

export interface EventAttendeeWithUser extends Tables<'event_attendees'> {
  user: Tables<'profiles'>
}

export interface EventSpeaker {
  id: string
  event_id: string
  profile_id?: string
  name: string
  title: string
  bio?: string
  image_url?: string
  linkedin_url?: string
  website_url?: string
  is_featured: boolean
  sort_order: number
  created_at: string
}

export interface EventCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  sort_order: number
  is_active: boolean
}

export interface EventFilters {
  search?: string
  event_type?: Tables<'events'>['event_type'][]
  event_format?: Tables<'events'>['event_format'][]
  price_range?: {
    min: number
    max: number
  }
  date_range?: {
    start: string
    end: string
  }
  location?: string
  tags?: string[]
  featured_only?: boolean
  has_availability?: boolean
  certification_hours?: {
    min: number
    max: number
  }
}

export interface EventRegistrationData {
  event_id: string
  user_id: string
  registration_type: Tables<'event_attendees'>['registration_type']
  special_requirements?: string
  dietary_restrictions?: string[]
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  registration_questions?: Record<string, any>
  marketing_consent?: boolean
}

export interface EventAgendaItem {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  speaker_id?: string
  location?: string
  type: 'session' | 'break' | 'networking' | 'meal'
  materials?: string[]
}

export interface EventPricingTier {
  id: string
  name: string
  price: number
  description?: string
  features: string[]
  available_until?: string
  max_quantity?: number
  current_quantity: number
  is_default: boolean
}

export interface EventMetrics {
  total_registrations: number
  confirmed_attendees: number
  actual_attendees: number
  no_shows: number
  cancellations: number
  refunds: number
  revenue: number
  average_rating: number
  completion_rate: number
  conversion_rate: number
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

// Event management types
export type CreateEventData = Omit<TablesInsert<'events'>, 'id' | 'created_at' | 'updated_at' | 'current_attendees'>
export type UpdateEventData = Partial<CreateEventData>

export type CreateEventRegistrationData = Omit<TablesInsert<'event_attendees'>, 'id' | 'registered_at'>
export type UpdateEventRegistrationData = Partial<CreateEventRegistrationData>

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

// =====================================================================
// PAYMENT SYSTEM TYPES
// =====================================================================

// Payment Customers
export interface PaymentCustomer {
  id: string
  user_id: string
  stripe_customer_id: string
  email?: string
  default_payment_method_id?: string
  invoice_settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type CreatePaymentCustomerData = Omit<PaymentCustomer, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentCustomerData = Partial<CreatePaymentCustomerData>

// Payment Methods
export interface PaymentMethod {
  id: string
  customer_id: string
  stripe_payment_method_id: string
  type: 'card' | 'bank_account' | 'sepa_debit' | 'ideal' | 'paypal'
  card_info?: {
    last4: string
    brand: string
    exp_month: number
    exp_year: number
    country: string
    fingerprint: string
  }
  billing_details?: {
    name?: string
    email?: string
    phone?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreatePaymentMethodData = Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentMethodData = Partial<CreatePaymentMethodData>

// Payment Products
export interface PaymentProduct {
  id: string
  stripe_product_id: string
  name: string
  description?: string
  type: 'session' | 'package' | 'course' | 'event' | 'membership'
  reference_id?: string
  metadata: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreatePaymentProductData = Omit<PaymentProduct, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentProductData = Partial<CreatePaymentProductData>

// Payment Prices
export interface PaymentPrice {
  id: string
  product_id: string
  stripe_price_id: string
  currency: string
  unit_amount: number // Amount in cents
  billing_scheme: 'per_unit' | 'tiered'
  recurring_interval?: 'day' | 'week' | 'month' | 'year'
  recurring_interval_count?: number
  trial_period_days?: number
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type CreatePaymentPriceData = Omit<PaymentPrice, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentPriceData = Partial<CreatePaymentPriceData>

// Payment Intents
export interface PaymentIntent {
  id: string
  customer_id: string
  stripe_payment_intent_id: string
  amount: number // Amount in cents
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 
          'processing' | 'requires_capture' | 'canceled' | 'succeeded'
  payment_method_id?: string
  description?: string
  receipt_email?: string
  entity_type?: 'session' | 'course' | 'event' | 'package'
  entity_id?: string
  charges?: Record<string, any>
  metadata: Record<string, any>
  canceled_at?: string
  succeeded_at?: string
  created_at: string
  updated_at: string
}

export type CreatePaymentIntentData = Omit<PaymentIntent, 'id' | 'created_at' | 'updated_at'>
export type UpdatePaymentIntentData = Partial<CreatePaymentIntentData>

// Setup Intents
export interface SetupIntent {
  id: string
  customer_id: string
  stripe_setup_intent_id: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' |
          'processing' | 'canceled' | 'succeeded'
  payment_method_id?: string
  usage: 'on_session' | 'off_session'
  metadata: Record<string, any>
  canceled_at?: string
  succeeded_at?: string
  created_at: string
  updated_at: string
}

export type CreateSetupIntentData = Omit<SetupIntent, 'id' | 'created_at' | 'updated_at'>
export type UpdateSetupIntentData = Partial<CreateSetupIntentData>

// Subscription Plans
export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price_id: string
  features: string[]
  max_sessions?: number
  coach_revenue_share: number
  is_active: boolean
  sort_order: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanWithPrice extends SubscriptionPlan {
  price: PaymentPrice
}

export type CreateSubscriptionPlanData = Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>
export type UpdateSubscriptionPlanData = Partial<CreateSubscriptionPlanData>

// Subscriptions
export interface Subscription {
  id: string
  customer_id: string
  stripe_subscription_id: string
  plan_id: string
  status: 'trialing' | 'active' | 'incomplete' | 'incomplete_expired' |
          'past_due' | 'canceled' | 'unpaid' | 'paused'
  current_period_start: string
  current_period_end: string
  trial_start?: string
  trial_end?: string
  cancel_at?: string
  canceled_at?: string
  ended_at?: string
  sessions_used: number
  sessions_limit?: number
  discount_id?: string
  tax_percent?: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface SubscriptionWithDetails extends Subscription {
  customer: PaymentCustomer
  plan: SubscriptionPlanWithPrice
}

export type CreateSubscriptionData = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
export type UpdateSubscriptionData = Partial<CreateSubscriptionData>

// Invoices
export interface Invoice {
  id: string
  customer_id: string
  subscription_id?: string
  stripe_invoice_id: string
  invoice_number?: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  subtotal: number // Amount in cents
  tax: number // Amount in cents
  total: number // Amount in cents
  amount_paid: number
  amount_due: number
  currency: string
  due_date?: string
  period_start?: string
  period_end?: string
  paid_at?: string
  voided_at?: string
  hosted_invoice_url?: string
  invoice_pdf?: string
  receipt_number?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface InvoiceWithDetails extends Invoice {
  customer: PaymentCustomer
  line_items: InvoiceLineItem[]
}

export type CreateInvoiceData = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
export type UpdateInvoiceData = Partial<CreateInvoiceData>

// Invoice Line Items
export interface InvoiceLineItem {
  id: string
  invoice_id: string
  stripe_line_item_id?: string
  description: string
  quantity: number
  unit_amount: number // Amount in cents
  amount: number // Total amount in cents
  currency: string
  product_id?: string
  price_id?: string
  period_start?: string
  period_end?: string
  metadata: Record<string, any>
  created_at: string
}

export type CreateInvoiceLineItemData = Omit<InvoiceLineItem, 'id' | 'created_at'>

// Webhook Events
export interface WebhookEvent {
  id: string
  stripe_event_id: string
  event_type: string
  api_version?: string
  livemode: boolean
  data: Record<string, any>
  request_id?: string
  idempotency_key?: string
  processed: boolean
  processed_at?: string
  processing_error?: string
  retry_count: number
  created_at: string
}

export type CreateWebhookEventData = Omit<WebhookEvent, 'id' | 'processed' | 'processed_at' | 'processing_error' | 'retry_count' | 'created_at'>

// Payment Processing Log
export interface PaymentProcessingLog {
  id: string
  payment_intent_id?: string
  subscription_id?: string
  event_type: string
  status: string
  message?: string
  user_id?: string
  stripe_event_id?: string
  ip_address?: string
  user_agent?: string
  request_data?: Record<string, any>
  response_data?: Record<string, any>
  error_data?: Record<string, any>
  created_at: string
}

export type CreatePaymentProcessingLogData = Omit<PaymentProcessingLog, 'id' | 'created_at'>

// Revenue Records
export interface RevenueRecord {
  id: string
  payment_intent_id: string
  gross_amount: number // Amount in cents
  platform_fee: number // Amount in cents
  coach_amount: number // Amount in cents
  stripe_fee: number // Amount in cents
  net_amount: number // Amount in cents
  coach_id?: string
  coach_payout_status: 'pending' | 'processing' | 'paid' | 'failed'
  coach_payout_date?: string
  coach_payout_reference?: string
  entity_type: string
  entity_id: string
  currency: string
  processed_at: string
  created_at: string
}

export interface RevenueRecordWithDetails extends RevenueRecord {
  payment_intent: PaymentIntent
  coach?: CoachWithProfile
}

export type CreateRevenueRecordData = Omit<RevenueRecord, 'id' | 'processed_at' | 'created_at'>

// Refunds
export interface Refund {
  id: string
  payment_intent_id: string
  stripe_refund_id: string
  amount: number // Amount in cents
  currency: string
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  charge_id?: string
  receipt_number?: string
  failure_reason?: string
  coach_adjustment: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface RefundWithDetails extends Refund {
  payment_intent: PaymentIntent
}

export type CreateRefundData = Omit<Refund, 'id' | 'created_at' | 'updated_at'>
export type UpdateRefundData = Partial<CreateRefundData>

// =====================================================================
// COACH APPLICATION SYSTEM TYPES
// =====================================================================

// Coach Application types
export interface CoachApplicationWithDetails extends Tables<'coach_applications'> {
  applicant: Tables<'profiles'>
  documents: ApplicationDocumentWithDetails[]
  references: ApplicationReferenceWithDetails[]
  reviews: ApplicationReviewWithDetails[]
  interviews: ApplicationInterviewWithDetails[]
  status_history: ApplicationStatusHistoryWithDetails[]
  notifications: ApplicationNotificationWithDetails[]
  progress: number
  average_rating?: number
}

export interface ApplicationDocumentWithDetails extends Tables<'application_documents'> {
  verified_by_profile?: Tables<'profiles'>
}

export interface ApplicationReferenceWithDetails extends Tables<'application_references'> {
  // Additional computed properties can be added here
}

export interface ApplicationReviewWithDetails extends Tables<'application_reviews'> {
  reviewer: Tables<'profiles'>
}

export interface ApplicationInterviewWithDetails extends Tables<'application_interviews'> {
  interviewer: Tables<'profiles'>
}

export interface ApplicationStatusHistoryWithDetails extends Tables<'application_status_history'> {
  changed_by_profile?: Tables<'profiles'>
}

export interface ApplicationNotificationWithDetails extends Tables<'application_notifications'> {
  recipient: Tables<'profiles'>
}

export interface AdminReviewQueueWithDetails extends Tables<'admin_review_queues'> {
  application: CoachApplicationWithDetails
  assigned_to_profile?: Tables<'profiles'>
}

// Form data types
export interface CoachApplicationFormData {
  // Personal Information
  first_name: string
  last_name: string
  email: string
  phone: string
  
  // Professional Information
  ipec_certification_number: string
  certification_level: 'Associate' | 'Professional' | 'Master'
  certification_date: string
  experience_years: number
  hourly_rate?: number
  
  // Profile Information
  bio: string
  specializations: string[]
  languages: string[]
  website?: string
  linkedin_url?: string
  
  // Application Content
  cover_letter: string
  motivation?: string
  additional_notes?: string
  referral_source?: string
  
  // Documents (File objects, not stored in main form data)
  documents?: {
    resume?: File[]
    certifications?: File[]
    identity?: File[]
    insurance?: File[]
    portfolio?: File[]
    additional?: File[]
  }
  
  // References
  references: ApplicationReferenceFormData[]
}

export interface ApplicationReferenceFormData {
  name: string
  email: string
  phone?: string
  relationship: string
  organization?: string
}

export interface DocumentUploadData {
  document_type: Tables<'application_documents'>['document_type']
  files: File[]
  is_required?: boolean
}

// Admin review types
export interface ApplicationReviewFormData {
  review_type: Tables<'application_reviews'>['review_type']
  decision?: Tables<'application_reviews'>['decision']
  credentials_rating?: number
  experience_rating?: number
  communication_rating?: number
  professionalism_rating?: number
  overall_rating?: number
  strengths?: string
  concerns?: string
  recommendations?: string
  notes?: string
}

export interface InterviewSchedulingData {
  interviewer_id: string
  scheduled_at: string
  duration_minutes?: number
  meeting_url?: string
  meeting_platform?: string
}

export interface InterviewFeedbackData {
  coaching_skills_rating?: number
  communication_rating?: number
  culture_fit_rating?: number
  technical_rating?: number
  overall_rating?: number
  notes?: string
  recommendation?: Tables<'application_interviews'>['recommendation']
  next_steps?: string
}

// Search and filter types
export interface CoachApplicationFilters {
  status?: Tables<'coach_applications'>['status'][]
  certification_level?: Tables<'coach_applications'>['certification_level'][]
  experience_years_min?: number
  experience_years_max?: number
  submitted_date_range?: {
    start: string
    end: string
  }
  reviewer_id?: string
  specializations?: string[]
  languages?: string[]
  rating_min?: number
}

export interface AdminReviewQueueFilters {
  queue_type?: Tables<'admin_review_queues'>['queue_type'][]
  status?: Tables<'admin_review_queues'>['status'][]
  assigned_to?: string
  priority?: number[]
  due_date_range?: {
    start: string
    end: string
  }
  complexity_score?: number[]
}

// Dashboard and analytics types
export interface CoachApplicationMetrics {
  total_applications: number
  pending_applications: number
  under_review_applications: number
  approved_applications: number
  rejected_applications: number
  average_review_time_days: number
  approval_rate: number
  applications_by_month: Array<{ month: string; count: number }>
  applications_by_status: Array<{ status: string; count: number }>
  average_rating: number
  top_specializations: Array<{ specialization: string; count: number }>
}

export interface ReviewerPerformanceMetrics {
  reviewer_id: string
  reviewer_name: string
  total_reviews: number
  average_review_time_hours: number
  reviews_this_month: number
  average_rating_given: number
  review_distribution: Array<{ decision: string; count: number }>
}

export interface ApplicationProgressData {
  application_id: string
  current_step: number
  total_steps: number
  completed_steps: string[]
  next_steps: string[]
  estimated_completion_date?: string
  blocking_issues?: string[]
}

// Notification types
export interface NotificationTemplateData {
  type: Tables<'application_notifications'>['type']
  template_name: string
  subject_template: string
  email_template: string
  sms_template?: string
  variables: Record<string, any>
}

export interface BulkNotificationData {
  application_ids: string[]
  notification_type: Tables<'application_notifications'>['type']
  template_data: NotificationTemplateData
  delivery_method?: Tables<'application_notifications'>['delivery_method']
  scheduled_at?: string
}

// Reference verification types
export interface ReferenceVerificationRequest {
  reference_id: string
  verification_token: string
  questions: ReferenceQuestion[]
}

export interface ReferenceQuestion {
  id: string
  question: string
  type: 'rating' | 'text' | 'boolean' | 'multiple_choice'
  required: boolean
  options?: string[] // for multiple_choice
  max_rating?: number // for rating
}

export interface ReferenceResponse {
  reference_id: string
  verification_token: string
  responses: Array<{
    question_id: string
    answer: any
  }>
  overall_rating: number
  comments: string
  would_recommend: boolean
}

// Admin workflow types
export interface WorkflowStepConfig {
  step_name: string
  queue_type: Tables<'admin_review_queues'>['queue_type']
  required: boolean
  estimated_hours: number
  auto_assign_rules?: {
    based_on: 'expertise' | 'workload' | 'availability' | 'random'
    criteria?: Record<string, any>
  }
  approval_threshold?: number // minimum rating required
  escalation_rules?: {
    condition: string
    escalate_to: string
    after_hours: number
  }
}

export interface ApplicationWorkflow {
  workflow_id: string
  name: string
  description: string
  steps: WorkflowStepConfig[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Export and import types
export interface ApplicationExportData {
  application: CoachApplicationWithDetails
  documents_metadata: ApplicationDocumentWithDetails[]
  references: ApplicationReferenceWithDetails[]
  reviews: ApplicationReviewWithDetails[]
  interviews: ApplicationInterviewWithDetails[]
  status_history: ApplicationStatusHistoryWithDetails[]
}

export interface BulkApplicationImportData {
  applications: Partial<CoachApplicationFormData>[]
  validation_options: {
    skip_duplicates: boolean
    validate_emails: boolean
    require_documents: boolean
  }
}

// API response types for coach applications
export interface CoachApplicationApiResponse<T = any> extends ApiResponse<T> {
  application_id?: string
  current_status?: Tables<'coach_applications'>['status']
  next_steps?: string[]
}

// Create/Update types for coach applications
export type CreateCoachApplicationData = Omit<
  Tables<'coach_applications'>, 
  'id' | 'created_at' | 'updated_at' | 'submitted_at' | 'reviewed_at' | 'approval_date'
>

export type UpdateCoachApplicationData = Partial<CreateCoachApplicationData>

export type CreateApplicationDocumentData = Omit<
  Tables<'application_documents'>, 
  'id' | 'created_at' | 'updated_at' | 'verified_at'
>

export type CreateApplicationReferenceData = Omit<
  Tables<'application_references'>, 
  'id' | 'created_at' | 'updated_at' | 'contacted_at' | 'responded_at'
>

export type CreateApplicationReviewData = Omit<
  Tables<'application_reviews'>, 
  'id' | 'created_at'
>

export type CreateApplicationInterviewData = Omit<
  Tables<'application_interviews'>, 
  'id' | 'created_at' | 'updated_at' | 'conducted_at'
>

export type CreateApplicationNotificationData = Omit<
  Tables<'application_notifications'>, 
  'id' | 'created_at' | 'sent_at' | 'delivered_at' | 'read_at'
>

export type CreateAdminReviewQueueData = Omit<
  Tables<'admin_review_queues'>, 
  'id' | 'created_at' | 'updated_at' | 'started_at' | 'completed_at'
>

// Payment method setup types
export interface PaymentMethodSetupData {
  customer_id: string
  payment_method_type: 'card' | 'bank_account'
  return_url: string
  usage: 'on_session' | 'off_session'
}

// Payment processing types
export interface PaymentProcessingResult {
  success: boolean
  payment_intent?: PaymentIntent
  error?: {
    code: string
    message: string
    type: string
  }
  requires_action?: boolean
  client_secret?: string
}

export interface SubscriptionCreationResult {
  success: boolean
  subscription?: Subscription
  payment_intent?: PaymentIntent
  error?: {
    code: string
    message: string
    type: string
  }
  requires_payment_method?: boolean
  client_secret?: string
}

// Webhook processing types
export interface WebhookProcessingResult {
  success: boolean
  processed: boolean
  error?: string
  updated_entities?: {
    payment_intents?: string[]
    subscriptions?: string[]
    invoices?: string[]
    customers?: string[]
  }
}

// Financial summary types
export interface PaymentSummary {
  total_payments: number
  successful_payments: number
  failed_payments: number
  total_amount: number // In cents
  total_refunds: number // In cents
  net_revenue: number // In cents
  currency: string
  period_start: string
  period_end: string
}

export interface CoachPayoutSummary {
  coach_id: string
  pending_amount: number // In cents
  processing_amount: number // In cents
  paid_amount: number // In cents
  total_sessions: number
  total_revenue: number // In cents
  currency: string
  period_start: string
  period_end: string
}

// =====================================================================
// MESSAGING SYSTEM TYPES
// =====================================================================

// Enhanced messaging types that extend database types
export interface MessageWithDetails extends Tables<'messages'> {
  sender: Tables<'profiles'>
  receiver: Tables<'profiles'>
  reactions?: MessageReactionWithUser[]
  isOwnMessage?: boolean
  isRead?: boolean
  isPending?: boolean
  failedToSend?: boolean
}

export interface MessageReactionWithUser extends Tables<'message_reactions'> {
  user: Tables<'profiles'>
}

export interface ConversationWithDetails extends Tables<'conversations'> {
  participant_profiles: Array<{
    id: string
    full_name: string | null
    avatar_url: string | null
    is_online: boolean
    last_seen: string | null
  }>
  last_message?: MessageWithDetails
  unread_count: number
  other_participant?: Tables<'profiles'>
  is_group?: boolean
}

export interface TypingIndicatorWithUser extends Tables<'typing_indicators'> {
  user: Tables<'profiles'>
}

export interface UserPresenceWithProfile extends Tables<'user_presence'> {
  profile: Tables<'profiles'>
}

// Message composition and sending types
export interface SendMessageRequest {
  conversationId?: string
  receiverId?: string
  content: string
  messageType?: Database['public']['Enums']['message_type']
  file?: File
  replyToMessageId?: string
}

export interface MessageFormData {
  content: string
  files: File[]
  replyToMessageId?: string
}

export interface FileUploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

// Conversation management types
export interface ConversationFilters {
  search?: string
  unread_only?: boolean
  archived?: boolean
  message_type?: Database['public']['Enums']['message_type'][]
  date_range?: {
    start: string
    end: string
  }
  participants?: string[]
}

export interface CreateConversationRequest {
  participants: string[]
  initial_message?: string
}

// Real-time messaging types
export interface RealtimeMessagePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Tables<'messages'>
  old?: Tables<'messages'>
}

export interface RealtimeTypingPayload {
  conversationId: string
  userId: string
  isTyping: boolean
  timestamp: string
}

export interface RealtimePresencePayload {
  userId: string
  isOnline: boolean
  lastSeen: string
}

// Message status and reactions
export interface MessageStatus {
  id: string
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
}

export interface EmojiReaction {
  emoji: string
  count: number
  users: Array<{
    id: string
    name: string
    avatar_url?: string
  }>
  hasReacted: boolean
}

export interface MessageContextMenu {
  messageId: string
  position: { x: number; y: number }
  actions: Array<{
    id: string
    label: string
    icon?: string
    action: () => void
    destructive?: boolean
  }>
}

// Notification and alert types
export interface MessageNotification {
  id: string
  conversationId: string
  messageId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  unread: boolean
}

export interface ConversationNotificationSettings {
  conversationId: string
  enabled: boolean
  sound: boolean
  desktop: boolean
  mobile: boolean
  email: boolean
  mute_until?: string
}

// Search and discovery types
export interface MessageSearchResult {
  message: MessageWithDetails
  conversation: ConversationWithDetails
  context_messages?: MessageWithDetails[]
  highlights?: {
    content: string[]
    file_name?: string[]
  }
}

export interface MessageSearchFilters {
  query: string
  conversation_id?: string
  sender_id?: string
  message_type?: Database['public']['Enums']['message_type'][]
  has_files?: boolean
  date_range?: {
    start: string
    end: string
  }
}

export interface UserSearchResult {
  user: Tables<'profiles'>
  is_coach: boolean
  is_client: boolean
  mutual_conversations: number
  last_interaction?: string
}

// File and media handling types
export interface MessageFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnail_url?: string
  is_image: boolean
  is_video: boolean
  is_audio: boolean
  is_document: boolean
  upload_progress?: number
}

export interface MediaGalleryItem {
  id: string
  messageId: string
  conversationId: string
  file: MessageFile
  timestamp: string
  sender: Tables<'profiles'>
}

export interface MediaGalleryFilters {
  conversation_id?: string
  file_types?: string[]
  date_range?: {
    start: string
    end: string
  }
}

// Conversation settings and preferences
export interface ConversationSettings {
  conversationId: string
  notifications: ConversationNotificationSettings
  theme?: 'light' | 'dark' | 'auto'
  font_size?: 'small' | 'medium' | 'large'
  show_read_receipts: boolean
  show_typing_indicators: boolean
  auto_download_media: boolean
  media_quality?: 'high' | 'medium' | 'low'
}

export interface GlobalMessagingSettings {
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    mobile: boolean
    email: boolean
    quiet_hours?: {
      enabled: boolean
      start: string
      end: string
    }
  }
  privacy: {
    read_receipts: boolean
    typing_indicators: boolean
    online_status: boolean
    last_seen: boolean
  }
  media: {
    auto_download: boolean
    auto_download_mobile: boolean
    quality: 'high' | 'medium' | 'low'
    max_file_size_mb: number
  }
  appearance: {
    theme: 'light' | 'dark' | 'auto'
    font_size: 'small' | 'medium' | 'large'
    compact_mode: boolean
    show_avatars: boolean
  }
}

// Analytics and metrics types
export interface ConversationMetrics {
  conversation_id: string
  total_messages: number
  messages_today: number
  messages_this_week: number
  messages_this_month: number
  most_active_hour: number
  most_active_day: number
  average_response_time_minutes: number
  message_types_distribution: Record<string, number>
  participants_activity: Array<{
    user_id: string
    message_count: number
    last_active: string
  }>
}

export interface UserMessagingMetrics {
  user_id: string
  total_conversations: number
  active_conversations: number
  total_messages_sent: number
  total_messages_received: number
  average_response_time_minutes: number
  most_contacted_users: Array<{
    user_id: string
    user_name: string
    message_count: number
  }>
  daily_activity: Array<{
    date: string
    messages_sent: number
    messages_received: number
  }>
}

// Coach-client messaging types
export interface CoachClientConversation extends ConversationWithDetails {
  session_context?: {
    session_id: string
    session_date: string
    session_status: string
  }
  coaching_context?: {
    coach_id: string
    client_id: string
    coaching_package?: string
    session_count: number
    next_session?: string
  }
}

export interface SessionMessage extends MessageWithDetails {
  session_context: {
    session_id: string
    session_type: string
    pre_session?: boolean
    post_session?: boolean
    homework_related?: boolean
  }
}

// Create/Update types for messaging
export type CreateConversationData = Omit<Tables<'conversations'>, 'id' | 'created_at' | 'updated_at'>
export type UpdateConversationData = Partial<CreateConversationData>

export type CreateMessageData = Omit<Tables<'messages'>, 'id' | 'created_at' | 'updated_at'>
export type UpdateMessageData = Partial<CreateMessageData>

export type CreateMessageReactionData = Omit<Tables<'message_reactions'>, 'id' | 'created_at'>

export type CreateTypingIndicatorData = Omit<Tables<'typing_indicators'>, 'id' | 'updated_at'>
export type UpdateTypingIndicatorData = Partial<CreateTypingIndicatorData>

export type CreateUserPresenceData = Omit<Tables<'user_presence'>, 'updated_at'>
export type UpdateUserPresenceData = Partial<CreateUserPresenceData>

// API response types for messaging
export interface MessagingApiResponse<T = any> extends ApiResponse<T> {
  conversation_id?: string
  message_id?: string
  unread_count?: number
  presence_status?: boolean
}

// Pagination types for messaging
export interface MessagesPaginationOptions extends PaginationOptions {
  before_message_id?: string
  after_message_id?: string
  include_reactions?: boolean
  include_sender_details?: boolean
}

export interface ConversationsPaginationOptions extends PaginationOptions {
  include_last_message?: boolean
  include_participants?: boolean
  include_unread_count?: boolean
  filter_archived?: boolean
}