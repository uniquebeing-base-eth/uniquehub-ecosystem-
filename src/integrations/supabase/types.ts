export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      bloomers_mints: {
        Row: {
          created_at: string
          id: string
          minted_at: string | null
          token_id: number | null
          transaction_hash: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          minted_at?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          minted_at?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_id: string
          chain: string | null
          course_id: string
          created_at: string
          id: string
          image_url: string
          minted_at: string | null
          token_id: number | null
          token_uri: string | null
          transaction_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_id: string
          chain?: string | null
          course_id: string
          created_at?: string
          id?: string
          image_url: string
          minted_at?: string | null
          token_id?: number | null
          token_uri?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_id?: string
          chain?: string | null
          course_id?: string
          created_at?: string
          id?: string
          image_url?: string
          minted_at?: string | null
          token_id?: number | null
          token_uri?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string
          id: string
          is_published: boolean | null
          story_id: string
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          chapter_number: number
          content: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          story_id: string
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean | null
          story_id?: string
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      course_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction: Database["public"]["Enums"]["reaction_type"]
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction?: Database["public"]["Enums"]["reaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "course_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_comments: {
        Row: {
          comment: string
          course_id: string
          created_at: string
          id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          course_id: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          course_id?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "course_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_preview: boolean | null
          lesson_order: number
          moderation_notes: string | null
          moderation_status: string | null
          module_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean | null
          lesson_order?: number
          moderation_notes?: string | null
          moderation_status?: string | null
          module_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_preview?: boolean | null
          lesson_order?: number
          moderation_notes?: string | null
          moderation_status?: string | null
          module_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          module_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          module_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          module_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_payments: {
        Row: {
          amount: number
          buyer_user_id: string
          chain: string
          completed_at: string | null
          course_id: string
          created_at: string
          currency: string
          id: string
          seller_user_id: string
          status: string
          transaction_hash: string | null
        }
        Insert: {
          amount: number
          buyer_user_id: string
          chain?: string
          completed_at?: string | null
          course_id: string
          created_at?: string
          currency: string
          id?: string
          seller_user_id: string
          status?: string
          transaction_hash?: string | null
        }
        Update: {
          amount?: number
          buyer_user_id?: string
          chain?: string
          completed_at?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          id?: string
          seller_user_id?: string
          status?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          enrollment_count: number | null
          id: string
          likes_count: number | null
          price_usdc: number | null
          rating: number | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          enrollment_count?: number | null
          id?: string
          likes_count?: number | null
          price_usdc?: number | null
          rating?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          enrollment_count?: number | null
          id?: string
          likes_count?: number | null
          price_usdc?: number | null
          rating?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      creator_achievements: {
        Row: {
          achievement_level: number
          achievement_type: string
          awarded_at: string | null
          badge_color: string | null
          badge_icon: string | null
          id: string
          is_claimed: boolean | null
          milestone_value: number
          points_awarded: number | null
          user_id: string
        }
        Insert: {
          achievement_level?: number
          achievement_type: string
          awarded_at?: string | null
          badge_color?: string | null
          badge_icon?: string | null
          id?: string
          is_claimed?: boolean | null
          milestone_value: number
          points_awarded?: number | null
          user_id: string
        }
        Update: {
          achievement_level?: number
          achievement_type?: string
          awarded_at?: string | null
          badge_color?: string | null
          badge_icon?: string | null
          id?: string
          is_claimed?: boolean | null
          milestone_value?: number
          points_awarded?: number | null
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      farcaster_notifications: {
        Row: {
          created_at: string
          fid: number
          id: string
          notification_token: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          fid: number
          id?: string
          notification_token: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          fid?: number
          id?: string
          notification_token?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      learning_courses: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          title: string
          total_modules: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          total_modules?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          total_modules?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_modules: {
        Row: {
          content: Json | null
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_locked: boolean | null
          module_number: number
          points_reward: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          module_number: number
          points_reward?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_locked?: boolean | null
          module_number?: number
          points_reward?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_pools: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          number_of_winners: number | null
          pool_modules: Json | null
          required_streak: number | null
          reward_amount: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          number_of_winners?: number | null
          pool_modules?: Json | null
          required_streak?: number | null
          reward_amount?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          number_of_winners?: number | null
          pool_modules?: Json | null
          required_streak?: number | null
          reward_amount?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_watched_at: string | null
          lesson_id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_item_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_item_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          item_id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          item_id: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          item_id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_item_ratings: {
        Row: {
          created_at: string
          id: string
          item_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price_usdc: number
          rating: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_usdc: number
          rating?: number | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price_usdc?: number
          rating?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_completions: {
        Row: {
          accuracy_percentage: number | null
          completed_at: string | null
          course_id: string
          id: string
          module_id: string
          points_earned: number | null
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          course_id: string
          id?: string
          module_id: string
          points_earned?: number | null
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          course_id?: string
          id?: string
          module_id?: string
          points_earned?: number | null
          time_taken_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      multichain_claims: {
        Row: {
          amount: number
          chain_id: string
          claimed_at: string
          created_at: string
          id: string
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          amount: number
          chain_id: string
          claimed_at?: string
          created_at?: string
          id?: string
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          chain_id?: string
          claimed_at?: string
          created_at?: string
          id?: string
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nft_listings: {
        Row: {
          buyer_user_id: string | null
          chain: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string | null
          price_amount: number
          price_currency: string
          sold_at: string | null
          status: string
          token_address: string
          token_id: string
          token_standard: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_user_id?: string | null
          chain?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string | null
          price_amount: number
          price_currency: string
          sold_at?: string | null
          status?: string
          token_address: string
          token_id: string
          token_standard: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_user_id?: string | null
          chain?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string | null
          price_amount?: number
          price_currency?: string
          sold_at?: string | null
          status?: string
          token_address?: string
          token_id?: string
          token_standard?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["point_event_type"]
          id: string
          points_earned: number
          transaction_amount: number | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["point_event_type"]
          id?: string
          points_earned: number
          transaction_amount?: number | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["point_event_type"]
          id?: string
          points_earned?: number
          transaction_amount?: number | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pool_module_completions: {
        Row: {
          completed_at: string | null
          id: string
          module_id: string
          points_earned: number | null
          pool_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          module_id: string
          points_earned?: number | null
          pool_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          module_id?: string
          points_earned?: number | null
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_module_completions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "learning_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_module_completions_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "learning_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_participants: {
        Row: {
          id: string
          is_winner: boolean | null
          joined_at: string | null
          modules_completed: number | null
          pool_id: string
          rank: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          id?: string
          is_winner?: boolean | null
          joined_at?: string | null
          modules_completed?: number | null
          pool_id: string
          rank?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          id?: string
          is_winner?: boolean | null
          joined_at?: string | null
          modules_completed?: number | null
          pool_id?: string
          rank?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pool_participants_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "learning_pools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          farcaster_fid: number | null
          farcaster_username: string | null
          id: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          farcaster_fid?: number | null
          farcaster_username?: string | null
          id?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          farcaster_fid?: number | null
          farcaster_username?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string | null
          author_name: string
          category: string | null
          chapters: number | null
          cover_gradient: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          likes_count: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          category?: string | null
          chapters?: number | null
          cover_gradient?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          category?: string | null
          chapters?: number | null
          cover_gradient?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          points_awarded: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_reset_count: number | null
          total_modules_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_reset_count?: number | null
          total_modules_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_reset_count?: number | null
          total_modules_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_nft_generations: {
        Row: {
          generated_at: string
          id: string
          image_url: string
          is_minted: boolean | null
          metadata: Json | null
          minted_at: string | null
          token_id: number | null
          transaction_hash: string | null
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          image_url: string
          is_minted?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          image_url?: string
          is_minted?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          token_id?: number | null
          transaction_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          creator_points: number | null
          daily_streak: number
          id: string
          last_daily_checkin: string | null
          last_monthly_checkin: string | null
          last_weekly_checkin: string | null
          monthly_streak: number
          total_points: number
          updated_at: string
          user_id: string
          weekly_streak: number
        }
        Insert: {
          created_at?: string
          creator_points?: number | null
          daily_streak?: number
          id?: string
          last_daily_checkin?: string | null
          last_monthly_checkin?: string | null
          last_weekly_checkin?: string | null
          monthly_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
          weekly_streak?: number
        }
        Update: {
          created_at?: string
          creator_points?: number | null
          daily_streak?: number
          id?: string
          last_daily_checkin?: string | null
          last_monthly_checkin?: string | null
          last_weekly_checkin?: string | null
          monthly_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
          weekly_streak?: number
        }
        Relationships: []
      }
    }
    Views: {
      creator_leaderboard: {
        Row: {
          avatar_url: string | null
          creator_points: number | null
          display_name: string | null
          farcaster_username: string | null
          rank: number | null
          total_courses: number | null
          total_ratings: number | null
          total_students: number | null
          user_id: string | null
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          avatar_url: string | null
          current_streak: number | null
          display_name: string | null
          farcaster_username: string | null
          rank: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_creator_level: { Args: { course_count: number }; Returns: Json }
      increment_course_views: {
        Args: { course_id_param: string }
        Returns: undefined
      }
      increment_enrollment_count: {
        Args: { course_id: string }
        Returns: undefined
      }
      notify_via_edge_function: {
        Args: {
          broadcast?: boolean
          notification_data?: Json
          notification_type: string
          target_user_id?: string
        }
        Returns: undefined
      }
      toggle_course_like: {
        Args: { course_id_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      point_event_type:
        | "daily_checkin"
        | "weekly_checkin"
        | "monthly_checkin"
        | "buy_volume"
        | "trade_volume"
        | "task_completion"
        | "course_completion"
        | "course_purchase"
      reaction_type: "blue_heart" | "sparkles" | "fire"
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
      point_event_type: [
        "daily_checkin",
        "weekly_checkin",
        "monthly_checkin",
        "buy_volume",
        "trade_volume",
        "task_completion",
        "course_completion",
        "course_purchase",
      ],
      reaction_type: ["blue_heart", "sparkles", "fire"],
    },
  },
} as const
