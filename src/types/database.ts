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
      cuentas: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          moneda: string
          nombre: string
          plataforma: string
          tipo: string
          user_id: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          moneda?: string
          nombre: string
          plataforma: string
          tipo: string
          user_id: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          moneda?: string
          nombre?: string
          plataforma?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      movimientos: {
        Row: {
          created_at: string
          cuenta_id: string
          fecha: string
          id: string
          monto: number
          nota: string | null
          snapshot_id: string | null
          tasa_cambio: number | null
          tipo: string
        }
        Insert: {
          created_at?: string
          cuenta_id: string
          fecha: string
          id?: string
          monto: number
          nota?: string | null
          snapshot_id?: string | null
          tasa_cambio?: number | null
          tipo: string
        }
        Update: {
          created_at?: string
          cuenta_id?: string
          fecha?: string
          id?: string
          monto?: number
          nota?: string | null
          snapshot_id?: string | null
          tasa_cambio?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "capital_por_cuenta"
            referencedColumns: ["cuenta_id"]
          },
          {
            foreignKeyName: "movimientos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string
          cuenta_id: string
          fecha: string
          id: string
          tasa_cambio: number | null
          valor: number
        }
        Insert: {
          created_at?: string
          cuenta_id: string
          fecha: string
          id?: string
          tasa_cambio?: number | null
          valor: number
        }
        Update: {
          created_at?: string
          cuenta_id?: string
          fecha?: string
          id?: string
          tasa_cambio?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "capital_por_cuenta"
            referencedColumns: ["cuenta_id"]
          },
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      capital_por_cuenta: {
        Row: {
          capital_aportado: number | null
          capital_aportado_clp: number | null
          cuenta_id: string | null
          moneda: string | null
          nombre: string | null
          valor_actual: number | null
          valor_actual_clp: number | null
        }
        Relationships: []
      }
      evolucion_portafolio: {
        Row: {
          capital_aportado_acumulado_clp: number | null
          fecha: string | null
          valor_total_clp: number | null
        }
        Relationships: []
      }
      rendimiento_actual: {
        Row: {
          aportes_netos: number | null
          cuenta_id: string | null
          fecha: string | null
          ganancia_real: number | null
          moneda: string | null
          nombre: string | null
          rendimiento_pct: number | null
          tasa_cambio: number | null
          tasa_cambio_anterior: number | null
          valor: number | null
          valor_anterior: number | null
          valor_clp: number | null
          valor_clp_anterior: number | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "capital_por_cuenta"
            referencedColumns: ["cuenta_id"]
          },
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      rendimiento_semanal: {
        Row: {
          aportes_netos: number | null
          cuenta_id: string | null
          fecha: string | null
          ganancia_real: number | null
          moneda: string | null
          nombre: string | null
          rendimiento_pct: number | null
          tasa_cambio: number | null
          tasa_cambio_anterior: number | null
          valor: number | null
          valor_anterior: number | null
          valor_clp: number | null
          valor_clp_anterior: number | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "capital_por_cuenta"
            referencedColumns: ["cuenta_id"]
          },
          {
            foreignKeyName: "snapshots_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      crear_cuenta_con_aporte_inicial: {
        Args: {
          p_fecha?: string
          p_moneda: string
          p_monto_inicial: number
          p_nombre: string
          p_plataforma: string
          p_tasa_cambio?: number
          p_tipo: string
        }
        Returns: string
      }
      guardar_snapshot_con_movimiento: {
        Args: {
          p_cuenta_id: string
          p_fecha: string
          p_movimiento_monto?: number
          p_movimiento_tipo?: string
          p_permitir_quitar_movimiento?: boolean
          p_tasa_cambio?: number
          p_valor: number
        }
        Returns: string
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

export type Moneda = "CLP" | "USD" | "UF"
export type TipoCuenta = "fondo_mutuo" | "acciones" | "deposito_plazo" | "cripto" | "otro"
export type TipoMovimiento = "aporte" | "retiro"

export type Cuenta = Tables<"cuentas">
export type Snapshot = Tables<"snapshots">
export type Movimiento = Tables<"movimientos">
export type RendimientoActual = Tables<"rendimiento_actual">
export type CapitalPorCuenta = Tables<"capital_por_cuenta">
export type EvolucionPortafolio = Tables<"evolucion_portafolio">
