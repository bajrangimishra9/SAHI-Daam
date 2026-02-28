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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_allowlist_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      admin_allowlist_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          material_query: string
          radius_km: number
          result: Json
          vendor_pincode: string
          vendor_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_query?: string
          radius_km?: number
          result?: Json
          vendor_pincode?: string
          vendor_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_query?: string
          radius_km?: number
          result?: Json
          vendor_pincode?: string
          vendor_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          note: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["role_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          note?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rules_weights: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      supplier_documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          storage_bucket: string
          storage_path: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          storage_bucket?: string
          storage_path: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          storage_bucket?: string
          storage_path?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_materials: {
        Row: {
          available_stock: number | null
          brand: string | null
          bulk_discount_rules: Json
          category: Database["public"]["Enums"]["material_category"]
          created_at: string
          delivery_sla: string | null
          grade_strength: string | null
          id: string
          image_paths: string[]
          monsoon_price_rise_pct: number
          name: string
          supplier_id: string
          transport_params: Json
          unit_base_price: number
          updated_at: string
        }
        Insert: {
          available_stock?: number | null
          brand?: string | null
          bulk_discount_rules?: Json
          category: Database["public"]["Enums"]["material_category"]
          created_at?: string
          delivery_sla?: string | null
          grade_strength?: string | null
          id?: string
          image_paths?: string[]
          monsoon_price_rise_pct?: number
          name: string
          supplier_id: string
          transport_params?: Json
          unit_base_price?: number
          updated_at?: string
        }
        Update: {
          available_stock?: number | null
          brand?: string | null
          bulk_discount_rules?: Json
          category?: Database["public"]["Enums"]["material_category"]
          created_at?: string
          delivery_sla?: string | null
          grade_strength?: string | null
          id?: string
          image_paths?: string[]
          monsoon_price_rise_pct?: number
          name?: string
          supplier_id?: string
          transport_params?: Json
          unit_base_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_profiles: {
        Row: {
          business_name: string
          city: string | null
          created_at: string
          discoverable: boolean
          id: string
          logistics_notes: string | null
          pincode: string
          service_radius_km: number
          updated_at: string
          user_id: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          business_name?: string
          city?: string | null
          created_at?: string
          discoverable?: boolean
          id?: string
          logistics_notes?: string | null
          pincode?: string
          service_radius_km?: number
          updated_at?: string
          user_id: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          business_name?: string
          city?: string | null
          created_at?: string
          discoverable?: boolean
          id?: string
          logistics_notes?: string | null
          pincode?: string
          service_radius_km?: number
          updated_at?: string
          user_id?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_profiles: {
        Row: {
          created_at: string
          id: string
          pincode: string
          radius_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pincode?: string
          radius_km?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pincode?: string
          radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_supplier_doc_path: {
        Args: { _path: string }
        Returns: boolean
      }
      can_self_assign_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "vendor" | "supplier" | "admin"
      material_category: "civil" | "electrical" | "machinery"
      role_request_status: "pending" | "approved" | "rejected"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: ["vendor", "supplier", "admin"],
      material_category: ["civil", "electrical", "machinery"],
      role_request_status: ["pending", "approved", "rejected"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
