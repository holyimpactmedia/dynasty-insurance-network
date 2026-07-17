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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          email: string
          source: string | null
          suppressed_at: string
        }
        Insert: {
          email: string
          source?: string | null
          suppressed_at?: string
        }
        Update: {
          email?: string
          source?: string | null
          suppressed_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          age: number | null
          ai_score: number | null
          ai_score_reasons: string[] | null
          ai_scored_at: string | null
          created_at: string
          email: string
          first_name: string
          funnel_type: string | null
          household_size: string | null
          id: string
          income_range: string | null
          ip_address: string | null
          last_name: string
          phone: string | null
          predicted_close_rate: number | null
          priorities: string | null
          qualifying_event: string | null
          quiz_answers: Json | null
          reference_number: string
          sell_price: number
          state: string | null
          status: string
          tcpa_consent: boolean
          tcpa_consent_at: string | null
          trusted_form_cert_id: string | null
          trusted_form_cert_url: string | null
          trusted_form_claimed: boolean
          trusted_form_claimed_at: string | null
          updated_at: string
          usha_lead_id: string | null
          usha_sent_at: string | null
          usha_status: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          age?: number | null
          ai_score?: number | null
          ai_score_reasons?: string[] | null
          ai_scored_at?: string | null
          created_at?: string
          email: string
          first_name: string
          funnel_type?: string | null
          household_size?: string | null
          id?: string
          income_range?: string | null
          ip_address?: string | null
          last_name: string
          phone?: string | null
          predicted_close_rate?: number | null
          priorities?: string | null
          qualifying_event?: string | null
          quiz_answers?: Json | null
          reference_number: string
          sell_price?: number
          state?: string | null
          status?: string
          tcpa_consent?: boolean
          tcpa_consent_at?: string | null
          trusted_form_cert_id?: string | null
          trusted_form_cert_url?: string | null
          trusted_form_claimed?: boolean
          trusted_form_claimed_at?: string | null
          updated_at?: string
          usha_lead_id?: string | null
          usha_sent_at?: string | null
          usha_status?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          age?: number | null
          ai_score?: number | null
          ai_score_reasons?: string[] | null
          ai_scored_at?: string | null
          created_at?: string
          email?: string
          first_name?: string
          funnel_type?: string | null
          household_size?: string | null
          id?: string
          income_range?: string | null
          ip_address?: string | null
          last_name?: string
          phone?: string | null
          predicted_close_rate?: number | null
          priorities?: string | null
          qualifying_event?: string | null
          quiz_answers?: Json | null
          reference_number?: string
          sell_price?: number
          state?: string | null
          status?: string
          tcpa_consent?: boolean
          tcpa_consent_at?: string | null
          trusted_form_cert_id?: string | null
          trusted_form_cert_url?: string | null
          trusted_form_claimed?: boolean
          trusted_form_claimed_at?: string | null
          updated_at?: string
          usha_lead_id?: string | null
          usha_sent_at?: string | null
          usha_status?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_lead_counts: {
        Args: never
        Returns: {
          count: number
          day: string
        }[]
      }
      get_funnel_breakdown: {
        Args: never
        Returns: {
          funnel_type: string
          leads: number
          revenue: number
          sent: number
        }[]
      }
      get_pipeline_stats: {
        Args: never
        Returns: {
          leads_month: number
          leads_today: number
          sent_count: number
          sent_revenue: number
          sent_revenue_month: number
          tcpa_verified: number
          total_leads: number
        }[]
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
