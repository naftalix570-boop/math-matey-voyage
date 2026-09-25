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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      guest_players: {
        Row: {
          answered: number
          claimed_by: string | null
          code: string
          country: string
          created_at: string
          data: Json
          display_name: string
          icon: string
          score: number
          secret: string
          suspicious: boolean
          updated_at: string
          window_answers: number
          window_start: string
        }
        Insert: {
          answered?: number
          claimed_by?: string | null
          code: string
          country?: string
          created_at?: string
          data?: Json
          display_name?: string
          icon?: string
          score?: number
          secret: string
          suspicious?: boolean
          updated_at?: string
          window_answers?: number
          window_start?: string
        }
        Update: {
          answered?: number
          claimed_by?: string | null
          code?: string
          country?: string
          created_at?: string
          data?: Json
          display_name?: string
          icon?: string
          score?: number
          secret?: string
          suspicious?: boolean
          updated_at?: string
          window_answers?: number
          window_start?: string
        }
        Relationships: []
      }
      player_scores: {
        Row: {
          answered: number
          score: number
          suspicious: boolean
          updated_at: string
          user_id: string
          window_answers: number
          window_start: string
        }
        Insert: {
          answered?: number
          score?: number
          suspicious?: boolean
          updated_at?: string
          user_id: string
          window_answers?: number
          window_start?: string
        }
        Update: {
          answered?: number
          score?: number
          suspicious?: boolean
          updated_at?: string
          user_id?: string
          window_answers?: number
          window_start?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string
          data: Json
          display_name: string
          icon: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string
          data?: Json
          display_name?: string
          icon?: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string
          data?: Json
          display_name?: string
          icon?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          max_uses: number
          reward_type: string
          uses: number
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          max_uses: number
          reward_type: string
          uses?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          max_uses?: number
          reward_type?: string
          uses?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      leaderboard_all: {
        Row: {
          country: string | null
          display_name: string | null
          icon: string | null
          is_guest: boolean | null
          player_id: string | null
          score: number | null
        }
        Relationships: []
      }
      leaderboard_public: {
        Row: {
          country: string | null
          display_name: string | null
          icon: string | null
          score: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_profile: {
        Args: never
        Returns: {
          country: string
          data: Json
          display_name: string
          icon: string
        }[]
      }
      sync_my_profile: {
        Args: {
          _country: string
          _data: Json
          _display_name: string
          _icon: string
          _score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
