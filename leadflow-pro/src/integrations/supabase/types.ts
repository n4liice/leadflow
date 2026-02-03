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
      leadflow_leads: {
        Row: {
          condominio: string | null
          created_at: string
          id: string
          nome: string
          origem: string | null
          status_validacao: Database["public"]["Enums"]["leadflow_status_validacao"]
          status_telefone: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          condominio?: string | null
          created_at?: string
          id?: string
          nome: string
          origem?: string | null
          status_validacao?: Database["public"]["Enums"]["leadflow_status_validacao"]
          status_telefone?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          condominio?: string | null
          created_at?: string
          id?: string
          nome?: string
          origem?: string | null
          status_validacao?: Database["public"]["Enums"]["leadflow_status_validacao"]
          status_telefone?: string | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      leadflow_campanhas: {
        Row: {
          created_at: string
          data_inicio: string | null
          id: string
          nome: string
          qtd_disparos: number
          horario_inicio: string | null
          horario_fim: string | null
          intervalo_minutos: number | null
          disparos_por_hora: number | null
          leads: Json | null
          templates: Json | null
          id_captador: string | null
          status: Database["public"]["Enums"]["status_campanha"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          id?: string
          nome: string
          qtd_disparos?: number
          horario_inicio?: string | null
          horario_fim?: string | null
          intervalo_minutos?: number | null
          disparos_por_hora?: number | null
          leads?: Json | null
          templates?: Json | null
          id_captador?: string | null
          status?: Database["public"]["Enums"]["status_campanha"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          id?: string
          nome?: string
          qtd_disparos?: number
          horario_inicio?: string | null
          horario_fim?: string | null
          intervalo_minutos?: number | null
          disparos_por_hora?: number | null
          leads?: Json | null
          templates?: Json | null
          id_captador?: string | null
          status?: Database["public"]["Enums"]["status_campanha"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadflow_campanhas_id_captador_fkey"
            columns: ["id_captador"]
            isOneToOne: false
            referencedRelation: "leadflow_captadores"
            referencedColumns: ["id"]
          }
        ]
      }
      leadflow_captadores: {
        Row: {
          created_at: string
          em_uso: boolean
          id: string
          instancia: string
          nome_captador: string | null
          telefone_cadastrado: string | null
          status_ativo: boolean
          token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          em_uso?: boolean
          id?: string
          instancia: string
          nome_captador?: string | null
          telefone_cadastrado?: string | null
          status_ativo?: boolean
          token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          em_uso?: boolean
          id?: string
          instancia?: string
          nome_captador?: string | null
          telefone_cadastrado?: string | null
          status_ativo?: boolean
          token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leadflow_disparos: {
        Row: {
          condominio: string | null
          created_at: string
          enviado_at: string | null
          erro_log: string | null
          id: string
          id_campanha: string
          id_captador: string | null
          id_lead: string | null
          id_template: string | null
          mensagem_enviada: string | null
          nome: string
          status_envio: Database["public"]["Enums"]["status_envio"]
          telefone: string
          updated_at: string
        }
        Insert: {
          condominio?: string | null
          created_at?: string
          enviado_at?: string | null
          erro_log?: string | null
          id?: string
          id_campanha: string
          id_captador?: string | null
          id_lead?: string | null
          id_template?: string | null
          mensagem_enviada?: string | null
          nome: string
          status_envio?: Database["public"]["Enums"]["status_envio"]
          telefone: string
          updated_at?: string
        }
        Update: {
          condominio?: string | null
          created_at?: string
          enviado_at?: string | null
          erro_log?: string | null
          id?: string
          id_campanha?: string
          id_captador?: string | null
          id_lead?: string | null
          id_template?: string | null
          mensagem_enviada?: string | null
          nome?: string
          status_envio?: Database["public"]["Enums"]["status_envio"]
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadflow_disparos_id_campanha_fkey"
            columns: ["id_campanha"]
            isOneToOne: false
            referencedRelation: "leadflow_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadflow_disparos_id_captador_fkey"
            columns: ["id_captador"]
            isOneToOne: false
            referencedRelation: "leadflow_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadflow_disparos_id_lead_fkey"
            columns: ["id_lead"]
            isOneToOne: false
            referencedRelation: "leadflow_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadflow_disparos_id_template_fkey"
            columns: ["id_template"]
            isOneToOne: false
            referencedRelation: "leadflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leadflow_templates: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      leadflow_campanha_templates: {
        Row: {
          id: string
          id_campanha: string
          id_template: string
          peso: number
          created_at: string
        }
        Insert: {
          id?: string
          id_campanha: string
          id_template: string
          peso?: number
          created_at?: string
        }
        Update: {
          id?: string
          id_campanha?: string
          id_template?: string
          peso?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadflow_campanha_templates_id_campanha_fkey"
            columns: ["id_campanha"]
            isOneToOne: false
            referencedRelation: "leadflow_campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadflow_campanha_templates_id_template_fkey"
            columns: ["id_template"]
            isOneToOne: false
            referencedRelation: "leadflow_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      leadflow_historico_mensagens: {
        Row: {
          id: string
          session_id: string
          message: string // JSON: { type: "human"|"system"|"ai", content: string, ... }
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          message?: string
          created_at?: string
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
      status_campanha: "rascunho" | "ativa" | "pausada" | "concluida"
      status_envio: "pendente" | "enviando" | "enviado" | "erro"
      status_validacao: "pendente" | "validado" | "invalido"
      leadflow_status_validacao: "pendente" | "validado" | "invalido"
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
      status_campanha: ["rascunho", "ativa", "pausada", "concluida"],
      status_envio: ["pendente", "enviando", "enviado", "erro"],
      status_validacao: ["pendente", "validado", "invalido"],
      leadflow_status_validacao: ["pendente", "validado", "invalido"],
    },
  },
} as const
