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
      user_projects: {
        Row: {
          created_at: string
          description: string | null
          github_url: string | null
          id: string
          live_url: string | null
          skills_demonstrated: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          live_url?: string | null
          skills_demonstrated?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          github_url?: string | null
          id?: string
          live_url?: string | null
          skills_demonstrated?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_skills: {
        Row: {
          created_at: string
          id: string
          proof_description: string | null
          proof_links: string[] | null
          proof_status: string | null
          skill_name: string
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proof_description?: string | null
          proof_links?: string[] | null
          proof_status?: string | null
          skill_name: string
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proof_description?: string | null
          proof_links?: string[] | null
          proof_status?: string | null
          skill_name?: string
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          resume_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          follow_up_date: string | null
          outcome_status: string | null
          feedback: string | null
          rejection_reason: string | null
          stage_reached: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          follow_up_date?: string | null
          outcome_status?: string | null
          feedback?: string | null
          rejection_reason?: string | null
          stage_reached?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          follow_up_date?: string | null
          outcome_status?: string | null
          feedback?: string | null
          rejection_reason?: string | null
          stage_reached?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters_generated: {
        Row: {
          application_id: string | null
          company: string | null
          company_research_summary: string | null
          cover_letter_content: string | null
          created_at: string
          id: string
          job_title: string | null
          pdf_url: string | null
          tone: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          company?: string | null
          company_research_summary?: string | null
          cover_letter_content?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          pdf_url?: string | null
          tone?: string | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          company?: string | null
          company_research_summary?: string | null
          cover_letter_content?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          pdf_url?: string | null
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_generated_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_prep: {
        Row: {
          answers: Json | null
          checklist: Json | null
          created_at: string
          id: string
          interview_id: string
          questions: Json | null
          topics: Json | null
        }
        Insert: {
          answers?: Json | null
          checklist?: Json | null
          created_at?: string
          id?: string
          interview_id: string
          questions?: Json | null
          topics?: Json | null
        }
        Update: {
          answers?: Json | null
          checklist?: Json | null
          created_at?: string
          id?: string
          interview_id?: string
          questions?: Json | null
          topics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_prep_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          id: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          notes: string | null
          prep_status: string | null
          round: number
          scheduled_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          notes?: string | null
          prep_status?: string | null
          round?: number
          scheduled_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          notes?: string | null
          prep_status?: string | null
          round?: number
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number
          matched_skills: Json | null
          missing_skills: Json | null
          recommendations: Json | null
          resume_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score: number
          matched_skills?: Json | null
          missing_skills?: Json | null
          recommendations?: Json | null
          resume_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          matched_skills?: Json | null
          missing_skills?: Json | null
          recommendations?: Json | null
          resume_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string
          created_at: string
          currency: string | null
          deadline: string | null
          description: string | null
          id: string
          location: string | null
          parsed_skills: Json | null
          posted_date: string | null
          role_category: string | null
          salary_max: number | null
          salary_min: number | null
          source: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          parsed_skills?: Json | null
          posted_date?: string | null
          role_category?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          location?: string | null
          parsed_skills?: Json | null
          posted_date?: string | null
          role_category?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          progress_percentage: number | null
          resource_id: string | null
          skill_id: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          resource_id?: string | null
          skill_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          resource_id?: string | null
          skill_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_paths_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "learning_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_paths_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill_gaps"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          affiliate_url: string | null
          created_at: string
          difficulty: string | null
          duration_minutes: number | null
          id: string
          platform: string | null
          price: number | null
          rating: number | null
          resource_name: string
          skill_name: string
          url: string
        }
        Insert: {
          affiliate_url?: string | null
          created_at?: string
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          platform?: string | null
          price?: number | null
          rating?: number | null
          resource_name: string
          skill_name: string
          url: string
        }
        Update: {
          affiliate_url?: string | null
          created_at?: string
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          platform?: string | null
          price?: number | null
          rating?: number | null
          resource_name?: string
          skill_name?: string
          url?: string
        }
        Relationships: []
      }
      linkedin_optimizations: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          role_target: string | null
          strength_score: number | null
          suggested_about: string | null
          suggested_headlines: Json | null
          suggested_skills: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          role_target?: string | null
          strength_score?: number | null
          suggested_about?: string | null
          suggested_headlines?: Json | null
          suggested_skills?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          role_target?: string | null
          strength_score?: number | null
          suggested_about?: string | null
          suggested_headlines?: Json | null
          suggested_skills?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_optimizations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_profiles: {
        Row: {
          about: string | null
          created_at: string
          experience: Json | null
          featured: Json | null
          headline: string | null
          id: string
          last_optimized_at: string | null
          skills: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          created_at?: string
          experience?: Json | null
          featured?: Json | null
          headline?: string | null
          id?: string
          last_optimized_at?: string | null
          skills?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          created_at?: string
          experience?: Json | null
          featured?: Json | null
          headline?: string | null
          id?: string
          last_optimized_at?: string | null
          skills?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_contacts: {
        Row: {
          company: string | null
          created_at: string
          id: string
          last_contacted_at: string | null
          linkedin_url: string | null
          name: string
          next_followup_at: string | null
          notes: string | null
          role: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name: string
          next_followup_at?: string | null
          notes?: string | null
          role?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          last_contacted_at?: string | null
          linkedin_url?: string | null
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          role?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          experience_level: string | null
          experience_years: number | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          location_preference: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          primary_target_role: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          target_role: string | null
          target_roles: string[]
          updated_at: string
          work_preference: string | null
        }
        Insert: {
          created_at?: string
          email: string
          experience_level?: string | null
          experience_years?: number | null
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          location_preference?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          primary_target_role?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          target_role?: string | null
          target_roles?: string[]
          updated_at?: string
          work_preference?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          experience_level?: string | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          location_preference?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          primary_target_role?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          target_role?: string | null
          target_roles?: string[]
          updated_at?: string
          work_preference?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: Json | null
          created_at: string
          file_path: string | null
          file_url: string
          id: string
          is_default: boolean | null
          name: string
          parsed_skills: Json | null
          parsed_summary: string | null
          type: string | null
          updated_at: string | null
          user_id: string
          version: number | null
          version_tag: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          file_path?: string | null
          file_url: string
          id?: string
          is_default?: boolean | null
          name: string
          parsed_skills?: Json | null
          parsed_summary?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
          version_tag?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          file_path?: string | null
          file_url?: string
          id?: string
          is_default?: boolean | null
          name?: string
          parsed_skills?: Json | null
          parsed_summary?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
          version_tag?: string | null
        }
        Relationships: []
      }
      resumes_generated: {
        Row: {
          application_id: string | null
          ats_score: number | null
          company: string | null
          created_at: string
          id: string
          job_title: string | null
          match_percentage: number | null
          pdf_url: string | null
          resume_markdown: string | null
          resume_pdf_url: string | null
          skills_matched: Json | null
          skills_missing: Json | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          ats_score?: number | null
          company?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          match_percentage?: number | null
          pdf_url?: string | null
          resume_markdown?: string | null
          resume_pdf_url?: string | null
          skills_matched?: Json | null
          skills_missing?: Json | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          ats_score?: number | null
          company?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          match_percentage?: number | null
          pdf_url?: string | null
          resume_markdown?: string | null
          resume_pdf_url?: string | null
          skills_matched?: Json | null
          skills_missing?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_generated_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gaps: {
        Row: {
          created_at: string
          id: string
          priority: number | null
          required_in_count: number | null
          skill_name: string
          user_has_it: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: number | null
          required_in_count?: number | null
          skill_name: string
          user_has_it?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: number | null
          required_in_count?: number | null
          skill_name?: string
          user_has_it?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_analytics_snapshots: {
        Row: {
          by_resume: Json | null
          by_role_category: Json | null
          created_at: string
          id: string
          snapshot_date: string
          total_applications: number
          total_interviews: number
          total_offers: number
          user_id: string
        }
        Insert: {
          by_resume?: Json | null
          by_role_category?: Json | null
          created_at?: string
          id?: string
          snapshot_date?: string
          total_applications?: number
          total_interviews?: number
          total_offers?: number
          user_id: string
        }
        Update: {
          by_resume?: Json | null
          by_role_category?: Json | null
          created_at?: string
          id?: string
          snapshot_date?: string
          total_applications?: number
          total_interviews?: number
          total_offers?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status:
        | "saved"
        | "applied"
        | "assessment"
        | "interview"
        | "offer"
        | "rejected"
      interview_type: "technical" | "hr" | "case" | "other"
      plan_type: "free" | "student" | "pro"
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
    Enums: {
      application_status: [
        "saved",
        "applied",
        "assessment",
        "interview",
        "offer",
        "rejected",
      ],
      interview_type: ["technical", "hr", "case", "other"],
      plan_type: ["free", "student", "pro"],
    },
  },
} as const
