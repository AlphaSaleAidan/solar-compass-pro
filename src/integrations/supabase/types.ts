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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string
          all_electric: boolean | null
          appointment_date: string
          appointment_time: string
          closer: string | null
          closer_notes: string | null
          created_at: string
          customer_name: string
          email: string | null
          high_bill: number | null
          id: string
          low_bill: number | null
          outcome: string | null
          phone: string | null
          rep_id: string | null
          setter: string | null
          stars: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address: string
          all_electric?: boolean | null
          appointment_date: string
          appointment_time: string
          closer?: string | null
          closer_notes?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          high_bill?: number | null
          id?: string
          low_bill?: number | null
          outcome?: string | null
          phone?: string | null
          rep_id?: string | null
          setter?: string | null
          stars?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          all_electric?: boolean | null
          appointment_date?: string
          appointment_time?: string
          closer?: string | null
          closer_notes?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          high_bill?: number | null
          id?: string
          low_bill?: number | null
          outcome?: string | null
          phone?: string | null
          rep_id?: string | null
          setter?: string | null
          stars?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financier_updates: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          sender_name: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role: string
          sender_name: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          sender_name?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "financier_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_releases: {
        Row: {
          amount: number
          approved_by: string | null
          id: string
          milestone: string
          percent: number
          project_id: string
          released_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          id?: string
          milestone: string
          percent: number
          project_id: string
          released_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          id?: string
          milestone?: string
          percent?: number
          project_id?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_releases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_states: {
        Row: {
          approved_by: string | null
          checklist_done: Json | null
          completed_at: string | null
          date_entries: Json | null
          fund_released_at: string | null
          fund_status: string | null
          id: string
          milestone_index: number
          ops_notes: string | null
          project_id: string
          text_entries: Json | null
          updated_at: string
          uploads: Json | null
        }
        Insert: {
          approved_by?: string | null
          checklist_done?: Json | null
          completed_at?: string | null
          date_entries?: Json | null
          fund_released_at?: string | null
          fund_status?: string | null
          id?: string
          milestone_index: number
          ops_notes?: string | null
          project_id: string
          text_entries?: Json | null
          updated_at?: string
          uploads?: Json | null
        }
        Update: {
          approved_by?: string | null
          checklist_done?: Json | null
          completed_at?: string | null
          date_entries?: Json | null
          fund_released_at?: string | null
          fund_status?: string | null
          id?: string
          milestone_index?: number
          ops_notes?: string | null
          project_id?: string
          text_entries?: Json | null
          updated_at?: string
          uploads?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_states_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_name: string | null
          bank_routing_number: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          platform_access: string[] | null
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          platform_access?: string[] | null
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          platform_access?: string[] | null
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_checklist_items: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          file_url: string | null
          id: string
          item_name: string
          item_type: string | null
          milestone_number: number
          notes: string | null
          project_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          item_name: string
          item_type?: string | null
          milestone_number: number
          notes?: string | null
          project_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          item_name?: string
          item_type?: string | null
          milestone_number?: number
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name?: string | null
          file_url: string
          id?: string
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          sender_id: string | null
          sender_name: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          sender_id?: string | null
          sender_name: string
          sender_role: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          fund_amount: number | null
          fund_released: boolean | null
          id: string
          milestone_name: string
          milestone_number: number
          notes: string | null
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          fund_amount?: number | null
          fund_released?: boolean | null
          id?: string
          milestone_name: string
          milestone_number: number
          notes?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          fund_amount?: number | null
          fund_released?: boolean | null
          id?: string
          milestone_name?: string
          milestone_number?: number
          notes?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          adders: Json | null
          address: string | null
          annual_production: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          aurora_data: Json | null
          aurora_project_id: string | null
          aurora_synced_at: string | null
          battery: string | null
          city: string | null
          closer: string | null
          closer_clawback: boolean | null
          closer_pay: number | null
          contract_value: number | null
          created_at: string
          credit_status: Database["public"]["Enums"]["credit_status"]
          current_milestone: number | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          dirty_notes: string | null
          documents_sent: boolean | null
          escalation_rate: number | null
          financier: string | null
          financier_funded: number | null
          financier_org_id: string | null
          id: string
          installer_company: string | null
          installer_contact: string | null
          installer_org_id: string | null
          inverter_type: string | null
          monthly_payment: number | null
          organization_id: string | null
          panel_count: number | null
          panel_type: string | null
          price_per_watt: number | null
          project_code: string | null
          project_cost: number | null
          rep_name: string | null
          roof_condition: string | null
          roof_type: string | null
          sales_rep_id: string | null
          sell_project_id: string | null
          setter: string | null
          setter_pay: number | null
          site_survey_completed: boolean | null
          site_survey_data: Json | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          submitted_for_approval: boolean | null
          system_size: number | null
          updated_at: string
          welcome_call_completed: boolean | null
          welcome_call_data: Json | null
          zip: string | null
        }
        Insert: {
          adders?: Json | null
          address?: string | null
          annual_production?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          aurora_data?: Json | null
          aurora_project_id?: string | null
          aurora_synced_at?: string | null
          battery?: string | null
          city?: string | null
          closer?: string | null
          closer_clawback?: boolean | null
          closer_pay?: number | null
          contract_value?: number | null
          created_at?: string
          credit_status?: Database["public"]["Enums"]["credit_status"]
          current_milestone?: number | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          dirty_notes?: string | null
          documents_sent?: boolean | null
          escalation_rate?: number | null
          financier?: string | null
          financier_funded?: number | null
          financier_org_id?: string | null
          id?: string
          installer_company?: string | null
          installer_contact?: string | null
          installer_org_id?: string | null
          inverter_type?: string | null
          monthly_payment?: number | null
          organization_id?: string | null
          panel_count?: number | null
          panel_type?: string | null
          price_per_watt?: number | null
          project_code?: string | null
          project_cost?: number | null
          rep_name?: string | null
          roof_condition?: string | null
          roof_type?: string | null
          sales_rep_id?: string | null
          sell_project_id?: string | null
          setter?: string | null
          setter_pay?: number | null
          site_survey_completed?: boolean | null
          site_survey_data?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_for_approval?: boolean | null
          system_size?: number | null
          updated_at?: string
          welcome_call_completed?: boolean | null
          welcome_call_data?: Json | null
          zip?: string | null
        }
        Update: {
          adders?: Json | null
          address?: string | null
          annual_production?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          aurora_data?: Json | null
          aurora_project_id?: string | null
          aurora_synced_at?: string | null
          battery?: string | null
          city?: string | null
          closer?: string | null
          closer_clawback?: boolean | null
          closer_pay?: number | null
          contract_value?: number | null
          created_at?: string
          credit_status?: Database["public"]["Enums"]["credit_status"]
          current_milestone?: number | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          dirty_notes?: string | null
          documents_sent?: boolean | null
          escalation_rate?: number | null
          financier?: string | null
          financier_funded?: number | null
          financier_org_id?: string | null
          id?: string
          installer_company?: string | null
          installer_contact?: string | null
          installer_org_id?: string | null
          inverter_type?: string | null
          monthly_payment?: number | null
          organization_id?: string | null
          panel_count?: number | null
          panel_type?: string | null
          price_per_watt?: number | null
          project_code?: string | null
          project_cost?: number | null
          rep_name?: string | null
          roof_condition?: string | null
          roof_type?: string | null
          sales_rep_id?: string | null
          sell_project_id?: string | null
          setter?: string | null
          setter_pay?: number | null
          site_survey_completed?: boolean | null
          site_survey_data?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          submitted_for_approval?: boolean | null
          system_size?: number | null
          updated_at?: string
          welcome_call_completed?: boolean | null
          welcome_call_data?: Json | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_financier_org_id_fkey"
            columns: ["financier_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_installer_org_id_fkey"
            columns: ["installer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          created_at: string
          email: string
          entity_name: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          entity_name?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          entity_name?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          earned_at: string | null
          id: string
          project_id: string | null
          reward_name: string
          reward_type: string
          reward_value: number | null
          user_id: string
        }
        Insert: {
          earned_at?: string | null
          id?: string
          project_id?: string | null
          reward_name: string
          reward_type: string
          reward_value?: number | null
          user_id: string
        }
        Update: {
          earned_at?: string | null
          id?: string
          project_id?: string | null
          reward_name?: string
          reward_type?: string
          reward_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sell_projects: {
        Row: {
          address: string | null
          all_electric: boolean | null
          approval_status: string | null
          aurora_data: Json | null
          aurora_synced: boolean | null
          closer: string | null
          closer_notes: string | null
          converted_to_sale: boolean | null
          created_at: string | null
          created_by: string
          credit_status: string | null
          documents_sent: boolean | null
          email: string | null
          first_name: string
          high_bill: number | null
          id: string
          last_name: string
          low_bill: number | null
          organization_id: string | null
          phone: string | null
          project_code: string | null
          rejection_reason: string | null
          setter: string | null
          site_survey_complete: boolean | null
          site_survey_photos: Json | null
          submitted_for_approval: boolean | null
          updated_at: string | null
          welcome_call_answers: Json | null
          welcome_call_complete: boolean | null
        }
        Insert: {
          address?: string | null
          all_electric?: boolean | null
          approval_status?: string | null
          aurora_data?: Json | null
          aurora_synced?: boolean | null
          closer?: string | null
          closer_notes?: string | null
          converted_to_sale?: boolean | null
          created_at?: string | null
          created_by: string
          credit_status?: string | null
          documents_sent?: boolean | null
          email?: string | null
          first_name: string
          high_bill?: number | null
          id?: string
          last_name: string
          low_bill?: number | null
          organization_id?: string | null
          phone?: string | null
          project_code?: string | null
          rejection_reason?: string | null
          setter?: string | null
          site_survey_complete?: boolean | null
          site_survey_photos?: Json | null
          submitted_for_approval?: boolean | null
          updated_at?: string | null
          welcome_call_answers?: Json | null
          welcome_call_complete?: boolean | null
        }
        Update: {
          address?: string | null
          all_electric?: boolean | null
          approval_status?: string | null
          aurora_data?: Json | null
          aurora_synced?: boolean | null
          closer?: string | null
          closer_notes?: string | null
          converted_to_sale?: boolean | null
          created_at?: string | null
          created_by?: string
          credit_status?: string | null
          documents_sent?: boolean | null
          email?: string | null
          first_name?: string
          high_bill?: number | null
          id?: string
          last_name?: string
          low_bill?: number | null
          organization_id?: string | null
          phone?: string | null
          project_code?: string | null
          rejection_reason?: string | null
          setter?: string | null
          site_survey_complete?: boolean | null
          site_survey_photos?: Json | null
          submitted_for_approval?: boolean | null
          updated_at?: string | null
          welcome_call_answers?: Json | null
          welcome_call_complete?: boolean | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_name: string | null
          sender_role: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_name?: string | null
          sender_role?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_name?: string | null
          sender_role?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          created_by_role: string | null
          customer_name: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_code: string | null
          project_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          created_by_role?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_code?: string | null
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          created_by_role?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_code?: string | null
          project_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "sales_rep"
        | "backend_ops"
        | "installer"
        | "financier"
        | "master"
      credit_status: "pending" | "passed" | "failed"
      milestone_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "fund_released"
      org_type: "asp_core" | "installer_company" | "financier_company"
      project_status:
        | "new"
        | "credit_check"
        | "aurora_synced"
        | "converted"
        | "documents_sent"
        | "welcome_call_done"
        | "site_survey_done"
        | "submitted_for_approval"
        | "approved_clean"
        | "marked_dirty"
        | "in_pipeline"
        | "completed"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status: "open" | "in_progress" | "resolved" | "escalated"
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
      app_role: [
        "sales_rep",
        "backend_ops",
        "installer",
        "financier",
        "master",
      ],
      credit_status: ["pending", "passed", "failed"],
      milestone_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "fund_released",
      ],
      org_type: ["asp_core", "installer_company", "financier_company"],
      project_status: [
        "new",
        "credit_check",
        "aurora_synced",
        "converted",
        "documents_sent",
        "welcome_call_done",
        "site_survey_done",
        "submitted_for_approval",
        "approved_clean",
        "marked_dirty",
        "in_pipeline",
        "completed",
      ],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: ["open", "in_progress", "resolved", "escalated"],
    },
  },
} as const
