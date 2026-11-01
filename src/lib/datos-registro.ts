import type { SupabaseClient } from "@supabase/supabase-js";
import { fechaHoyChile } from "@/lib/fecha";
import type { Cuenta, TipoMovimiento } from "@/types/database";

export interface DatosRegistro {
  cuentas: Cuenta[];
  // aporte/retiro ya guardado hoy por cuenta (para precargar el formulario)
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
  // ultimo valor conocido (moneda nativa) de cada cuenta
  valorAnteriorPorCuenta: Record<string, number | null>;
}

// consultas que alimentan los formularios de registro diario. mismas lecturas
// y mismo armado que usaba el dashboard: solo se movieron aca para compartirlas
// con /registrar. no calcula ningun rendimiento.
export async function cargarDatosRegistro(supabase: SupabaseClient): Promise<DatosRegistro> {
  const hoy = fechaHoyChile();
  const [{ data: cuentas }, { data: snapshotsHoy }, { data: capitalPorCuenta }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("created_at"),
    supabase.from("snapshots").select("id, cuenta_id").eq("fecha", hoy),
    supabase.from("capital_por_cuenta").select("cuenta_id, valor_actual"),
  ]);

  const snapshotIdsHoy = (snapshotsHoy ?? []).map((s: { id: string }) => s.id);
  const { data: movimientosHoyRaw } =
    snapshotIdsHoy.length > 0
      ? await supabase.from("movimientos").select("tipo, monto, snapshot_id").in("snapshot_id", snapshotIdsHoy)
      : { data: [] as { tipo: string; monto: number; snapshot_id: string | null }[] };

  const snapshotIdACuenta = new Map(
    (snapshotsHoy ?? []).map((s: { id: string; cuenta_id: string }) => [s.id, s.cuenta_id])
  );
  const movimientosHoy: DatosRegistro["movimientosHoy"] = {};
  (movimientosHoyRaw ?? []).forEach((m: { tipo: string; monto: number; snapshot_id: string | null }) => {
    const cuentaId = m.snapshot_id ? snapshotIdACuenta.get(m.snapshot_id) : undefined;
    if (cuentaId) movimientosHoy[cuentaId] = { tipo: m.tipo as TipoMovimiento, monto: m.monto };
  });

  const valorPorCuenta = new Map(
    (capitalPorCuenta ?? []).map((c: { cuenta_id: string | null; valor_actual: number | null }) => [
      c.cuenta_id,
      c.valor_actual,
    ])
  );
  const valorAnteriorPorCuenta: DatosRegistro["valorAnteriorPorCuenta"] = {};
  ((cuentas ?? []) as Cuenta[]).forEach((cuenta) => {
    valorAnteriorPorCuenta[cuenta.id] = valorPorCuenta.get(cuenta.id) ?? null;
  });

  return { cuentas: (cuentas ?? []) as Cuenta[], movimientosHoy, valorAnteriorPorCuenta };
}
