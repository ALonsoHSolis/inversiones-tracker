"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { filasACsv, descargarCsv } from "@/lib/csv";

const ENCABEZADO = [
  "cuenta",
  "plataforma",
  "tipo_cuenta",
  "moneda",
  "fecha",
  "valor",
  "tasa_cambio",
  "movimiento_tipo",
  "movimiento_monto",
];

export function ExportarDatos() {
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setError(null);
    setExportando(true);
    const supabase = createClient();

    try {
      // todas las cuentas, activas e inactivas -- es un respaldo completo,
      // no solo lo que se ve hoy en el dashboard.
      const [{ data: cuentas, error: e1 }, { data: snapshots, error: e2 }, { data: movimientos, error: e3 }] =
        await Promise.all([
          supabase.from("cuentas").select("*"),
          supabase.from("snapshots").select("*"),
          supabase.from("movimientos").select("*"),
        ]);

      if (e1 || e2 || e3) throw new Error((e1 ?? e2 ?? e3)?.message ?? "error al leer los datos");

      const cuentaPorId = new Map((cuentas ?? []).map((c) => [c.id, c]));

      // mismo criterio que src/app/cuentas/[id]/historial/page.tsx: el
      // movimiento asociado a un snapshot esta ligado por snapshot_id, o es
      // huerfano (snapshot_id null) en la misma cuenta+fecha.
      const movimientoPorSnapshotId = new Map(
        (movimientos ?? []).filter((m) => m.snapshot_id).map((m) => [m.snapshot_id as string, m])
      );
      const movimientoHuerfanoPorCuentaFecha = new Map(
        (movimientos ?? []).filter((m) => !m.snapshot_id).map((m) => [`${m.cuenta_id}|${m.fecha}`, m])
      );

      const filas = (snapshots ?? [])
        .slice()
        .sort((a, b) => a.cuenta_id.localeCompare(b.cuenta_id) || a.fecha.localeCompare(b.fecha))
        .map((s) => {
          const cuenta = cuentaPorId.get(s.cuenta_id);
          const movimiento =
            movimientoPorSnapshotId.get(s.id) ?? movimientoHuerfanoPorCuentaFecha.get(`${s.cuenta_id}|${s.fecha}`);
          return [
            cuenta?.nombre ?? "",
            cuenta?.plataforma ?? "",
            cuenta?.tipo ?? "",
            cuenta?.moneda ?? "",
            s.fecha,
            String(s.valor),
            s.tasa_cambio != null ? String(s.tasa_cambio) : "",
            movimiento?.tipo ?? "",
            movimiento ? String(movimiento.monto) : "",
          ];
        });

      const csv = filasACsv(ENCABEZADO, filas);
      const hoy = new Date().toISOString().slice(0, 10);
      descargarCsv(csv, `inversiones-tracker-${hoy}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "hubo un error al exportar");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={exportar}
        disabled={exportando}
        className="text-xs text-gray-500 underline disabled:opacity-50"
      >
        {exportando ? "exportando..." : "descargar mis datos (CSV)"}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
