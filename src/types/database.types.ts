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
      applications: {
        Row: {
          applied_at: string | null
          company_name: string
          company_type: string | null
          created_at: string | null
          critical_missing: string[] | null
          fit_level: string | null
          fit_score: number | null
          fit_summary: string | null
          id: string
          improvements: Json | null
          job_description: string | null
          job_link: string | null
          job_title: string
          matched_skills: string[] | null
          missing_skills: string[] | null
          next_action: string | null
          next_action_link: string | null
          outcome: string | null
          partial_skills: string[] | null
          resume_version_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company_name: string
          company_type?: string | null
          created_at?: string | null
          critical_missing?: string[] | null
          fit_level?: string | null
          fit_score?: number | null
          fit_summary?: string | null
          id?: string
          improvements?: Json | null
          job_description?: string | null
          job_link?: string | null
          job_title: string
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          next_action?: string | null
          next_action_link?: string | null
          outcome?: string | null
          partial_skills?: string[] | null
          resume_version_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company_name?: string
          company_type?: string | null
          created_at?: string | null
          critical_missing?: string[] | null
          fit_level?: string | null
          fit_score?: number | null
          fit_summary?: string | null
          id?: string
          improvements?: Json | null
          job_description?: string | null
          job_link?: string | null
          job_title?: string
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          next_action?: string | null
          next_action_link?: string | null
          outcome?: string | null
          partial_skills?: string[] | null
          resume_version_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: []
      }
      evidence_certifications: {
        Row: {
          created_at: string | null
          credential_url: string | null
          date_obtained: string | null
          id: string
          issuer: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_url?: string | null
          date_obtained?: string | null
          id?: string
          issuer?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_url?: string | null
          date_obtained?: string | null
          id?: string
          issuer?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_education: {
        Row: {
          created_at: string | null
          degree: string | null
          end_year: number | null
          field_of_study: string | null
          grade: string | null
          id: string
          institution: string | null
          is_current: boolean | null
          sort_order: number | null
          start_year: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string | null
          is_current?: boolean | null
          sort_order?: number | null
          start_year?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade?: string | null
          id?: string
          institution?: string | null
          is_current?: boolean | null
          sort_order?: number | null
          start_year?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_experience: {
        Row: {
          bullets: Json | null
          company: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string
          location: string | null
          skills_used: string[] | null
          sort_order: number | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          bullets?: Json | null
          company: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title: string
          location?: string | null
          skills_used?: string[] | null
          sort_order?: number | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          bullets?: Json | null
          company?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          skills_used?: string[] | null
          sort_order?: number | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_experience_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_projects: {
        Row: {
          bullets: Json | null
          created_at: string | null
          description: string | null
          end_date: string | null
          github_url: string | null
          id: string
          sort_order: number | null
          start_date: string | null
          tech_stack: string[] | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          bullets?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          sort_order?: number | null
          start_date?: string | null
          tech_stack?: string[] | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          bullets?: Json | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          github_url?: string | null
          id?: string
          sort_order?: number | null
          start_date?: string | null
          tech_stack?: string[] | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          proficiency: string | null
          proof_description: string | null
          proof_status: string | null
          skill_name: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          proficiency?: string | null
          proof_description?: string | null
          proof_status?: string | null
          skill_name: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          proficiency?: string | null
          proof_description?: string | null
          proof_status?: string | null
          skill_name?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_answers: {
        Row: {
          answer: string
          answer_type: string | null
          created_at: string | null
          id: string
          question: string
          question_index: number
          scores: Json
          session_id: string | null
        }
        Insert: {
          answer: string
          answer_type?: string | null
          created_at?: string | null
          id?: string
          question: string
          question_index: number
          scores: Json
          session_id?: string | null
        }
        Update: {
          answer?: string
          answer_type?: string | null
          created_at?: string | null
          id?: string
          question?: string
          question_index?: number
          scores?: Json
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
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
      interview_sessions: {
        Row: {
          application_id: string | null
          completed_at: string | null
          difficulty: string | null
          final_report: string | null
          final_score: number | null
          id: string
          mode: string | null
          questions: Json
          started_at: string | null
          status: string | null
          tracks: Json | null
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          completed_at?: string | null
          difficulty?: string | null
          final_report?: string | null
          final_score?: number | null
          id?: string
          mode?: string | null
          questions: Json
          started_at?: string | null
          status?: string | null
          tracks?: Json | null
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          completed_at?: string | null
          difficulty?: string | null
          final_report?: string | null
          final_score?: number | null
          id?: string
          mode?: string | null
          questions?: Json
          started_at?: string | null
          status?: string | null
          tracks?: Json | null
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      resume_version_changes: {
        Row: {
          changes: Json | null
          created_at: string | null
          from_version_id: string | null
          id: string
          saved_by: string | null
          to_version_id: string | null
        }
        Insert: {
          changes?: Json | null
          created_at?: string | null
          from_version_id?: string | null
          id?: string
          saved_by?: string | null
          to_version_id?: string | null
        }
        Update: {
          changes?: Json | null
          created_at?: string | null
          from_version_id?: string | null
          id?: string
          saved_by?: string | null
          to_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_version_changes_from_version_id_fkey"
            columns: ["from_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_version_changes_to_version_id_fkey"
            columns: ["to_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          application_id: string | null
          content: Json
          created_at: string | null
          docx_url: string | null
          id: string
          interviews_generated: number | null
          is_latest: boolean | null
          origin_type: string
          parent_version_id: string | null
          pdf_url: string | null
          saved_as_latest_at: string | null
          template_id: string | null
          times_used: number | null
          user_id: string
          version_label: string | null
          version_number: number
        }
        Insert: {
          application_id?: string | null
          content: Json
          created_at?: string | null
          docx_url?: string | null
          id?: string
          interviews_generated?: number | null
          is_latest?: boolean | null
          origin_type: string
          parent_version_id?: string | null
          pdf_url?: string | null
          saved_as_latest_at?: string | null
          template_id?: string | null
          times_used?: number | null
          user_id: string
          version_label?: string | null
          version_number?: number
        }
        Update: {
          application_id?: string | null
          content?: Json
          created_at?: string | null
          docx_url?: string | null
          id?: string
          interviews_generated?: number | null
          is_latest?: boolean | null
          origin_type?: string
          parent_version_id?: string | null
          pdf_url?: string | null
          saved_as_latest_at?: string | null
          template_id?: string | null
          times_used?: number | null
          user_id?: string
          version_label?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
      user_evidence: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          last_synced_at: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          last_synced_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          last_synced_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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

