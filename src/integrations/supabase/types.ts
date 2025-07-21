export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_space_id: string
          clicks: number | null
          country_code: string | null
          created_at: string
          date: string
          device_type: string | null
          id: string
          impressions: number | null
          revenue: number | null
        }
        Insert: {
          ad_space_id: string
          clicks?: number | null
          country_code?: string | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          impressions?: number | null
          revenue?: number | null
        }
        Update: {
          ad_space_id?: string
          clicks?: number | null
          country_code?: string | null
          created_at?: string
          date?: string
          device_type?: string | null
          id?: string
          impressions?: number | null
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          ad_space_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          start_date: string | null
          target_audience: Json | null
          updated_at: string
        }
        Insert: {
          ad_space_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          start_date?: string | null
          target_audience?: Json | null
          updated_at?: string
        }
        Update: {
          ad_space_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          start_date?: string | null
          target_audience?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_ad_space_id_fkey"
            columns: ["ad_space_id"]
            isOneToOne: false
            referencedRelation: "ad_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_spaces: {
        Row: {
          ad_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          device_targeting: string
          display_order: number | null
          id: string
          is_active: boolean
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          ad_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          device_targeting?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          ad_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          device_targeting?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string
          id: string
          target_details: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          target_details?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          target_details?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      anonymous_post_tracking: {
        Row: {
          block_expires_at: string | null
          block_reason: string | null
          created_at: string | null
          fingerprint_hash: string | null
          first_post_at: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          last_post_at: string | null
          post_count: number | null
          session_id: string
          topic_count: number | null
        }
        Insert: {
          block_expires_at?: string | null
          block_reason?: string | null
          created_at?: string | null
          fingerprint_hash?: string | null
          first_post_at?: string | null
          id?: string
          ip_address: unknown
          is_blocked?: boolean | null
          last_post_at?: string | null
          post_count?: number | null
          session_id: string
          topic_count?: number | null
        }
        Update: {
          block_expires_at?: string | null
          block_reason?: string | null
          created_at?: string | null
          fingerprint_hash?: string | null
          first_post_at?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          last_post_at?: string | null
          post_count?: number | null
          session_id?: string
          topic_count?: number | null
        }
        Relationships: []
      }
      banned_ips: {
        Row: {
          admin_notes: string | null
          appeal_status: string | null
          ban_type: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          ip_range: unknown | null
          is_active: boolean
          reason: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          appeal_status?: string | null
          ban_type?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          ip_range?: unknown | null
          is_active?: boolean
          reason: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          appeal_status?: string | null
          ban_type?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          ip_range?: unknown | null
          is_active?: boolean
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          action: string
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          match_type: string
          notes: string | null
          replacement_text: string | null
          severity: string
          updated_at: string
          word_pattern: string
        }
        Insert: {
          action?: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          match_type?: string
          notes?: string | null
          replacement_text?: string | null
          severity?: string
          updated_at?: string
          word_pattern: string
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          match_type?: string
          notes?: string | null
          replacement_text?: string | null
          severity?: string
          updated_at?: string
          word_pattern?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          birth_year: number | null
          canonical_url: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          name: string
          og_description: string | null
          og_image: string | null
          og_title: string | null
          parent_category_id: string | null
          play_level: string | null
          region: string | null
          requires_moderation: boolean | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          birth_year?: number | null
          canonical_url?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          parent_category_id?: string | null
          play_level?: string | null
          region?: string | null
          requires_moderation?: boolean | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          birth_year?: number | null
          canonical_url?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          name?: string
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          parent_category_id?: string | null
          play_level?: string | null
          region?: string | null
          requires_moderation?: boolean | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          justification: string
          name: string
          parent_category_id: string | null
          requested_by_user_id: string | null
          requester_display_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          justification: string
          name: string
          parent_category_id?: string | null
          requested_by_user_id?: string | null
          requester_display_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          justification?: string
          name?: string
          parent_category_id?: string | null
          requested_by_user_id?: string | null
          requester_display_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_requests_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analysis: {
        Row: {
          confidence_score: number | null
          content_hash: string
          content_type: string
          created_at: string | null
          id: string
          is_spam: boolean | null
          similarity_score: number | null
          spam_indicators: Json | null
        }
        Insert: {
          confidence_score?: number | null
          content_hash: string
          content_type: string
          created_at?: string | null
          id?: string
          is_spam?: boolean | null
          similarity_score?: number | null
          spam_indicators?: Json | null
        }
        Update: {
          confidence_score?: number | null
          content_hash?: string
          content_type?: string
          created_at?: string | null
          id?: string
          is_spam?: boolean | null
          similarity_score?: number | null
          spam_indicators?: Json | null
        }
        Relationships: []
      }
      forum_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      ip_activity_log: {
        Row: {
          action_data: Json | null
          activity_type: string
          blocked_reason: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          session_id: string | null
        }
        Insert: {
          action_data?: Json | null
          activity_type: string
          blocked_reason?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_blocked?: boolean | null
          session_id?: string | null
        }
        Update: {
          action_data?: Json | null
          activity_type?: string
          blocked_reason?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          session_id?: string | null
        }
        Relationships: []
      }
      ip_geolocation_cache: {
        Row: {
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_proxy: boolean | null
          is_vpn: boolean | null
          isp: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_visit_tracking: {
        Row: {
          category_visited: string | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          is_proxy: boolean | null
          is_vpn: boolean | null
          isp: string | null
          latitude: number | null
          longitude: number | null
          page_path: string
          page_title: string | null
          referrer: string | null
          region: string | null
          search_query: string | null
          session_end: string | null
          session_id: string | null
          session_start: string | null
          timezone: string | null
          topic_visited: string | null
          user_agent: string | null
          visit_duration: unknown | null
        }
        Insert: {
          category_visited?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          search_query?: string | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string | null
          timezone?: string | null
          topic_visited?: string | null
          user_agent?: string | null
          visit_duration?: unknown | null
        }
        Update: {
          category_visited?: string | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          region?: string | null
          search_query?: string | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string | null
          timezone?: string | null
          topic_visited?: string | null
          user_agent?: string | null
          visit_duration?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_visit_tracking_category_visited_fkey"
            columns: ["category_visited"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_visit_tracking_topic_visited_fkey"
            columns: ["topic_visited"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          bypass_level: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          ip_address: unknown
          ip_range: unknown | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          bypass_level?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          ip_address: unknown
          ip_range?: unknown | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          bypass_level?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          ip_address?: unknown
          ip_range?: unknown | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      moderation_appeals: {
        Row: {
          admin_response: string | null
          appeal_reason: string
          appellant_email: string | null
          appellant_id: string | null
          appellant_ip: unknown | null
          content_context: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_response?: string | null
          appeal_reason: string
          appellant_email?: string | null
          appellant_id?: string | null
          appellant_ip?: unknown | null
          content_context?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_response?: string | null
          appeal_reason?: string
          appellant_email?: string | null
          appellant_id?: string | null
          appellant_ip?: unknown | null
          content_context?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      moderation_history: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          moderator_id: string | null
          new_status: string
          old_status: string | null
          reason: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          moderator_id?: string | null
          new_status: string
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          moderator_id?: string | null
          new_status?: string
          old_status?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      peak_daily_visitors_tracking: {
        Row: {
          created_at: string
          id: string
          peak_count: number
          peak_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          peak_count?: number
          peak_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          peak_count?: number
          peak_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      peak_users_tracking: {
        Row: {
          created_at: string
          id: string
          peak_count: number
          peak_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          peak_count?: number
          peak_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          peak_count?: number
          peak_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          created_at: string
          display_order: number
          id: string
          option_text: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          option_text: string
          poll_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          option_text?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          voter_id: string | null
          voter_ip: unknown | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          voter_id?: string | null
          voter_ip?: unknown | null
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          voter_id?: string | null
          voter_ip?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          allow_anonymous_votes: boolean
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          is_multiple_choice: boolean
          question: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          allow_anonymous_votes?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_multiple_choice?: boolean
          question: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          allow_anonymous_votes?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_multiple_choice?: boolean
          question?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          ip_address: unknown
          is_anonymous: boolean | null
          moderation_status: string | null
          parent_post_id: string | null
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_anonymous?: boolean | null
          moderation_status?: string | null
          parent_post_id?: string | null
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_anonymous?: boolean | null
          moderation_status?: string | null
          parent_post_id?: string | null
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          reputation: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          reputation?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          reputation?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_post_id: string | null
          reported_topic_id: string | null
          reporter_id: string | null
          reporter_ip_address: unknown | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_post_id?: string | null
          reported_topic_id?: string | null
          reporter_id?: string | null
          reporter_ip_address?: unknown | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_post_id?: string | null
          reported_topic_id?: string | null
          reporter_id?: string | null
          reporter_ip_address?: unknown | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_topic_id_fkey"
            columns: ["reported_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          client_ip: unknown | null
          created_at: string
          event_details: Json | null
          event_type: string
          id: string
          severity: string | null
          user_agent: string | null
        }
        Insert: {
          client_ip?: unknown | null
          created_at?: string
          event_details?: Json | null
          event_type: string
          id?: string
          severity?: string | null
          user_agent?: string | null
        }
        Update: {
          client_ip?: unknown | null
          created_at?: string
          event_details?: Json | null
          event_type?: string
          id?: string
          severity?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      spam_detection_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spam_reports: {
        Row: {
          admin_notes: string | null
          automated_detection: boolean | null
          confidence_score: number | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          report_reason: string
          reporter_id: string | null
          reporter_ip: unknown | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          automated_detection?: boolean | null
          confidence_score?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          report_reason: string
          reporter_id?: string | null
          reporter_ip?: unknown | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          automated_detection?: boolean | null
          confidence_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          report_reason?: string
          reporter_id?: string | null
          reporter_ip?: unknown | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      temporary_users: {
        Row: {
          created_at: string
          display_name: string
          expires_at: string
          guest_number: number
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          expires_at?: string
          guest_number?: number
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          expires_at?: string
          guest_number?: number
          id?: string
          session_id?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category_id: string
          content: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_anonymous: boolean | null
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          moderation_status: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          reply_count: number | null
          slug: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_anonymous?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          moderation_status?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          reply_count?: number | null
          slug: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_anonymous?: boolean | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          moderation_status?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          reply_count?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_patterns: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          posting_velocity: number | null
          rapid_posting_count: number | null
          risk_score: number | null
          session_duration: unknown | null
          suspicious_patterns: Json | null
          user_identifier: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          posting_velocity?: number | null
          rapid_posting_count?: number | null
          risk_score?: number | null
          session_duration?: unknown | null
          suspicious_patterns?: Json | null
          user_identifier: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          posting_velocity?: number | null
          rapid_posting_count?: number | null
          risk_score?: number | null
          session_duration?: unknown | null
          suspicious_patterns?: Json | null
          user_identifier?: string
          user_type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_content_for_spam: {
        Args: { content_text: string; content_type?: string }
        Returns: Json
      }
      check_anonymous_rate_limit: {
        Args: { user_ip: unknown; session_id: string }
        Returns: boolean
      }
      check_banned_words: {
        Args: { content_text: string }
        Returns: Json
      }
      check_enhanced_anonymous_rate_limit: {
        Args: {
          user_ip: unknown
          p_session_id: string
          p_fingerprint_hash?: string
          p_content_type?: string
        }
        Returns: Json
      }
      check_enhanced_rate_limit_with_penalties: {
        Args: {
          user_ip: unknown
          p_session_id: string
          p_fingerprint_hash?: string
          p_content_type?: string
        }
        Returns: Json
      }
      check_ip_banned: {
        Args: { user_ip: unknown }
        Returns: Json
      }
      check_moderation_protection: {
        Args: { p_content_id: string; p_content_type: string }
        Returns: Json
      }
      check_previous_report_status: {
        Args: { p_post_id?: string; p_topic_id?: string }
        Returns: Json
      }
      check_user_rate_limit: {
        Args: { user_id: string }
        Returns: boolean
      }
      cleanup_expired_temp_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_anonymous_tracking: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_post_references: {
        Args: { deleted_post_id: string }
        Returns: undefined
      }
      cleanup_spam_detection_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_backwards_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_anonymous_session_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_temp_display_name: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_visitors: {
        Args: Record<PropertyKey, never>
        Returns: {
          ip_address: unknown
          country_code: string
          country_name: string
          city: string
          region: string
          latitude: number
          longitude: number
          current_page: string
          session_start: string
          last_activity: string
          total_pages: number
          is_vpn: boolean
        }[]
      }
      get_admin_display_name: {
        Args: { temp_user_id: string }
        Returns: string
      }
      get_categories_by_activity: {
        Args: { p_parent_category_id?: string; p_category_level?: number }
        Returns: {
          id: string
          name: string
          description: string
          slug: string
          color: string
          sort_order: number
          is_active: boolean
          created_at: string
          parent_category_id: string
          level: number
          region: string
          birth_year: number
          play_level: string
          last_activity_at: string
        }[]
      }
      get_category_stats: {
        Args: { category_id: string }
        Returns: {
          topic_count: number
          post_count: number
        }[]
      }
      get_comprehensive_ip_activity: {
        Args: { target_ip: unknown }
        Returns: {
          ip_address: unknown
          total_sessions: number
          total_page_visits: number
          total_posts: number
          total_topics: number
          total_reports: number
          blocked_attempts: number
          first_seen: string
          last_seen: string
          recent_activities: Json
          ban_status: Json
        }[]
      }
      get_enhanced_forum_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_topics: number
          total_posts: number
          total_members: number
          topics_today: number
          posts_today: number
          members_today: number
          topics_this_week: number
          posts_this_week: number
          members_this_week: number
          most_active_category: string
          top_poster: string
        }[]
      }
      get_enriched_posts: {
        Args: { p_topic_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          content: string
          author_id: string
          topic_id: string
          parent_post_id: string
          created_at: string
          updated_at: string
          moderation_status: string
          ip_address: unknown
          is_anonymous: boolean
          author_username: string
          author_avatar_url: string
          parent_post_content: string
          parent_post_author_username: string
          parent_post_author_avatar_url: string
          parent_post_created_at: string
          parent_post_moderation_status: string
        }[]
      }
      get_enriched_posts_count: {
        Args: { p_topic_id: string }
        Returns: number
      }
      get_enriched_topics: {
        Args: { p_category_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          title: string
          content: string
          author_id: string
          category_id: string
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          reply_count: number
          last_reply_at: string
          created_at: string
          updated_at: string
          slug: string
          moderation_status: string
          last_post_id: string
          author_username: string
          author_avatar_url: string
          category_name: string
          category_color: string
          category_slug: string
          parent_category_id: string
        }[]
      }
      get_enriched_topics_count: {
        Args: { p_category_id?: string }
        Returns: number
      }
      get_forum_setting: {
        Args: { key_name: string }
        Returns: Json
      }
      get_forum_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_topics: number
          total_posts: number
          total_members: number
        }[]
      }
      get_hot_topics: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          id: string
          title: string
          content: string
          author_id: string
          category_id: string
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          reply_count: number
          last_reply_at: string
          created_at: string
          updated_at: string
          username: string
          avatar_url: string
          category_name: string
          category_color: string
          category_slug: string
          slug: string
          hot_score: number
          last_post_id: string
          parent_category_id: string
          parent_category_slug: string
        }[]
      }
      get_hot_topics_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_most_commented_topics: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          id: string
          title: string
          content: string
          author_id: string
          category_id: string
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          reply_count: number
          last_reply_at: string
          created_at: string
          updated_at: string
          username: string
          avatar_url: string
          category_name: string
          category_color: string
          category_slug: string
          slug: string
          last_post_id: string
          parent_category_id: string
          parent_category_slug: string
        }[]
      }
      get_most_commented_topics_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_most_viewed_topics: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          id: string
          title: string
          content: string
          author_id: string
          category_id: string
          is_pinned: boolean
          is_locked: boolean
          view_count: number
          reply_count: number
          last_reply_at: string
          created_at: string
          updated_at: string
          username: string
          avatar_url: string
          category_name: string
          category_color: string
          category_slug: string
          slug: string
          last_post_id: string
          parent_category_id: string
          parent_category_slug: string
        }[]
      }
      get_most_viewed_topics_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_or_create_temp_user: {
        Args: { p_session_id: string }
        Returns: string
      }
      get_peak_daily_visitors: {
        Args: Record<PropertyKey, never>
        Returns: {
          peak_count: number
          peak_date: string
        }[]
      }
      get_peak_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          peak_count: number
          peak_date: string
        }[]
      }
      get_peak_visitors_24h: {
        Args: Record<PropertyKey, never>
        Returns: {
          peak_count: number
          peak_hour: string
        }[]
      }
      get_poll_results: {
        Args: { poll_id_param: string }
        Returns: {
          option_id: string
          option_text: string
          display_order: number
          vote_count: number
          percentage: number
        }[]
      }
      get_posts_count: {
        Args: { p_topic_id: string }
        Returns: number
      }
      get_reporter_behavior: {
        Args: { p_reporter_id?: string; p_reporter_ip?: unknown }
        Returns: Json
      }
      get_topics_count: {
        Args: { p_category_id?: string }
        Returns: number
      }
      get_topics_total_count: {
        Args: { p_category_id?: string }
        Returns: number
      }
      get_visitor_geographic_summary: {
        Args: { p_hours_back?: number }
        Returns: {
          country_code: string
          country_name: string
          visitor_count: number
          page_views: number
          avg_session_duration: unknown
        }[]
      }
      get_visitors_last_24h: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      increment: {
        Args: { x: number }
        Returns: number
      }
      increment_reply_count: {
        Args: { topic_id: string }
        Returns: undefined
      }
      increment_view_count: {
        Args: { topic_id: string }
        Returns: undefined
      }
      is_temporary_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_admin_user_id: string
          p_action_type: string
          p_target_type: string
          p_target_id: string
          p_target_details?: Json
        }
        Returns: undefined
      }
      log_ip_activity: {
        Args: {
          p_ip_address: unknown
          p_session_id: string
          p_activity_type: string
          p_content_id?: string
          p_content_type?: string
          p_action_data?: Json
          p_is_blocked?: boolean
          p_blocked_reason?: string
        }
        Returns: undefined
      }
      log_page_visit: {
        Args: {
          p_ip_address: unknown
          p_session_id: string
          p_page_path: string
          p_page_title?: string
          p_referrer?: string
          p_user_agent?: string
          p_search_query?: string
          p_category_id?: string
          p_topic_id?: string
        }
        Returns: undefined
      }
      log_page_visit_with_geolocation: {
        Args: {
          p_ip_address: unknown
          p_session_id: string
          p_page_path: string
          p_page_title?: string
          p_referrer?: string
          p_user_agent?: string
          p_search_query?: string
          p_category_id?: string
          p_topic_id?: string
          p_country_code?: string
          p_country_name?: string
          p_city?: string
          p_region?: string
          p_latitude?: number
          p_longitude?: number
          p_timezone?: string
          p_is_vpn?: boolean
          p_is_proxy?: boolean
          p_isp?: string
        }
        Returns: undefined
      }
      process_banned_words: {
        Args: { content_text: string }
        Returns: Json
      }
      record_anonymous_post: {
        Args: { user_ip: unknown; session_id: string }
        Returns: undefined
      }
      record_enhanced_anonymous_activity: {
        Args: {
          user_ip: unknown
          p_session_id: string
          p_fingerprint_hash?: string
          p_content_type?: string
        }
        Returns: undefined
      }
      reverse_text_content: {
        Args: { input_text: string }
        Returns: string
      }
      set_forum_setting: {
        Args: {
          key_name: string
          value: Json
          setting_type?: string
          category?: string
          description?: string
          is_public?: boolean
        }
        Returns: undefined
      }
      sync_topic_reply_counts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_peak_daily_visitors: {
        Args: { p_count: number; p_date: string }
        Returns: undefined
      }
      update_peak_users: {
        Args: { current_count: number }
        Returns: undefined
      }
      update_topic_last_reply: {
        Args: { topic_id: string }
        Returns: undefined
      }
      validate_anonymous_content: {
        Args: { content: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
