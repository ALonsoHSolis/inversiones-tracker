"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cuenta, TipoMovimiento } from "@/types/database";

interface FilaHistorial {
  snapshotId: string;
  fecha: string;
  valor: number;
  tasaCambio: number | null;
  movimiento: { tipo: TipoMovimiento; monto: number } | null;
}

interface HistorialFormProps {
  cuenta: Cuenta;
  filas: FilaHistorial[];
}

interface FilaState {
  valor: string;
  tasaCambio: string;
  incluyeMovimiento: boolean;
  movimientoTipo: TipoMovimiento;
  movimientoMonto: string;
  guardando: boolean;
  resultado: "ok" | string | null;
}

function filaInicial(fila: FilaHistorial): FilaState {
  return {
    valor: String(fila.valor),
    tasaCambio: fila.tasaCambio != null ? String(fila.tasaCambio) : "",
    incluyeMovimiento: !!fila.movimiento,
    movimientoTipo: fila.movimiento?.tipo ?? "aporte",
    movimientoMonto: fila.movimiento ? String(fila.movimiento.monto) : "",
    guardando: false,
    resultado: null,
  };
}

function formatoFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function HistorialForm({ cuenta, filas }: HistorialFormProps) {
  const [estados, setEstados] = useState<Record<string, FilaState>>(() =>
    Object.fromEntries(filas.map((f) => [f.snapshotId, filaInicial(f)]))
  );

  function actualizarFila(snapshotId: string, patch: Partial<FilaState>) {
    setEstados((prev) => ({ ...prev, [snapshotId]: { ...prev[snapshotId], ...patch } }));
  }

  async function guardarFila(fila: FilaHistorial) {
    const estado = estados[fila.snapshotId];

    if (Number(estado.valor) < 0) {
      actualizarFila(fila.snapshotId, { resultado: "el valor no puede ser negativo" });
      return;
    }
    if (cuenta.moneda !== "CLP" && !estado.tasaCambio) {
      actualizarFila(fila.snapshotId, { resultado: "falta la tasa de cambio" });
      return;
    }
    if (estado.incluyeMovimiento && !(Number(estado.movimientoMonto) > 0)) {
      actualizarFila(fila.snapshotId, { resultado: "el monto del aporte/retiro debe ser mayor a cero" });
      return;
    }

    actualizarFila(fila.snapshotId, { guardando: true, resultado: null });
    const supabase = createClient();

    const { error } = await supabase.rpc("guardar_snapshot_con_movimiento", {
      p_cuenta_id: cuenta.id,
      p_fecha: fila.fecha,
      p_valor: Number(estado.valor),
      p_tasa_cambio: cuenta.moneda === "CLP" ? undefined : Number(estado.tasaCambio),
      p_movimiento_tipo: estado.incluyeMovimiento ? estado.movimientoTipo : undefined,
      p_movimiento_monto: estado.incluyeMovimiento ? Number(estado.movimientoMonto) : undefined,
    });

    if (error) {
      actualizarFila(fila.snapshotId, { guardando: false, resultado: error.message });
      return;
    }
    actualizarFila(fila.snapshotId, { guardando: false, resultado: "ok" });
  }

  if (filas.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">todavia no hay historial para esta cuenta.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filas.map((fila) => {
        const estado = estados[fila.snapshotId];
        return (
          <div key={fila.snapshotId} className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 mb-2">{formatoFecha(fila.fecha)}</p>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-600">valor</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                value={estado.valor}
                onChange={(e) => actualizarFila(fila.snapshotId, { valor: e.target.value })}
              />
            </div>

            {cuenta.moneda !== "CLP" && (
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-xs text-gray-500">tasa de cambio</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                  value={estado.tasaCambio}
                  onChange={(e) => actualizarFila(fila.snapshotId, { tasaCambio: e.target.value })}
                />
              </div>
            )}

            <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={estado.incluyeMovimiento}
                onChange={(e) => actualizarFila(fila.snapshotId, { incluyeMovimiento: e.target.checked })}
              />
              esto incluye un aporte o retiro
            </label>

            {estado.incluyeMovimiento && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={estado.movimientoTipo}
                  onChange={(e) =>
                    actualizarFila(fila.snapshotId, { movimientoTipo: e.target.value as TipoMovimiento })
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-sm bg-white"
                >
                  <option value="aporte">aporte</option>
                  <option value="retiro">retiro</option>
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="monto"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  value={estado.movimientoMonto}
                  onChange={(e) => actualizarFila(fila.snapshotId, { movimientoMonto: e.target.value })}
                />
              </div>
            )}

            <button
              onClick={() => guardarFila(fila)}
              disabled={estado.guardando}
              className="mt-3 w-full rounded bg-gray-900 text-white text-sm py-1.5 disabled:opacity-50"
            >
              {estado.guardando ? "guardando..." : "guardar"}
            </button>

            {estado.resultado === "ok" && <p className="mt-2 text-xs text-green-700">guardado</p>}
            {estado.resultado && estado.resultado !== "ok" && (
              <p className="mt-2 text-xs text-red-700">{estado.resultado}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
