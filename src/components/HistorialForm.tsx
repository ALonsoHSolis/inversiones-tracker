"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InputMonto } from "@/components/InputMonto";
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
  // true si el usuario escribio directo en "valor" -- una vez en true, la
  // sugerencia automatica deja de tocar el campo (nunca pisa una edicion manual).
  valorEditadoManualmente: boolean;
  // true si esta fila ya tenia un aporte/retiro asociado al cargar la
  // pantalla -- la sugerencia automatica nunca se activa aca, porque "valor"
  // probablemente ya lo refleja de un guardado anterior y recalcularlo
  // podria pisar un numero correcto (ej. solo se quiere corregir el monto).
  tieneMovimientoOriginal: boolean;
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
    valorEditadoManualmente: false,
    tieneMovimientoOriginal: !!fila.movimiento,
  };
}

function calcularValorSugerido(valorAnterior: number | null, monto: string, tipo: TipoMovimiento): string {
  const base = valorAnterior ?? 0;
  const montoNum = Number(monto) || 0;
  const sugerido = tipo === "aporte" ? base + montoNum : base - montoNum;
  return String(sugerido);
}

const UMBRAL_RENDIMIENTO_IMPLAUSIBLE = 80;

// misma formula que la vista rendimiento_semanal (schema.sql): ganancia_real =
// valor - valor_anterior - aportes_netos, dividido por (valor_anterior +
// aportes_netos) cuando esa base es positiva. se estima aca ANTES de guardar
// para poder advertir si el numero que resultaria es implausible.
function estimarRendimientoPct(
  valorAnterior: number | null,
  valorNuevo: number,
  incluyeMovimiento: boolean,
  tipo: TipoMovimiento,
  monto: string
): number | null {
  if (valorAnterior == null) return null;
  const aportesNetos = incluyeMovimiento ? (tipo === "aporte" ? Number(monto) || 0 : -(Number(monto) || 0)) : 0;
  const base = valorAnterior + aportesNetos;
  if (base <= 0) return null;
  const gananciaReal = valorNuevo - valorAnterior - aportesNetos;
  return (gananciaReal / base) * 100;
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

  // filas viene ordenado por fecha descendente -- el valor anterior de la
  // fila i es el valor de la fila i+1 (la siguiente en el arreglo es
  // cronologicamente anterior). la primera fecha del historial no tiene
  // anterior (null).
  const valorAnteriorPorFila: Record<string, number | null> = {};
  filas.forEach((f, i) => {
    valorAnteriorPorFila[f.snapshotId] = filas[i + 1]?.valor ?? null;
  });

  function actualizarFila(snapshotId: string, patch: Partial<FilaState>) {
    setEstados((prev) => ({ ...prev, [snapshotId]: { ...prev[snapshotId], ...patch } }));
  }

  // la sugerencia solo aplica a un aporte/retiro NUEVO en esta edicion: si la
  // fila ya tenia un movimiento asociado, o el usuario ya edito "valor" a
  // mano, nunca se recalcula solo.
  function actualizarMovimiento(fila: FilaHistorial, patch: Partial<FilaState>) {
    const estado = estados[fila.snapshotId];
    const siguiente = { ...estado, ...patch };
    const debeSugerir =
      siguiente.incluyeMovimiento && !estado.tieneMovimientoOriginal && !estado.valorEditadoManualmente;
    if (debeSugerir) {
      patch.valor = calcularValorSugerido(
        valorAnteriorPorFila[fila.snapshotId] ?? null,
        siguiente.movimientoMonto,
        siguiente.movimientoTipo
      );
    }
    actualizarFila(fila.snapshotId, patch);
  }

  async function guardarFila(fila: FilaHistorial) {
    const estado = estados[fila.snapshotId];

    if (Number(estado.valor) < 0) {
      actualizarFila(fila.snapshotId, { resultado: "el valor no puede ser negativo" });
      return;
    }
    if (cuenta.moneda !== "CLP" && !(Number(estado.tasaCambio) > 0)) {
      actualizarFila(fila.snapshotId, { resultado: "falta la tasa de cambio" });
      return;
    }
    if (estado.incluyeMovimiento && !(Number(estado.movimientoMonto) > 0)) {
      actualizarFila(fila.snapshotId, { resultado: "el monto del aporte/retiro debe ser mayor a cero" });
      return;
    }

    const anterior = valorAnteriorPorFila[fila.snapshotId];
    const valorSinCambio = estado.incluyeMovimiento && anterior != null && Number(estado.valor) === anterior;
    if (valorSinCambio) {
      const confirma = window.confirm(
        `El valor no cambió respecto al registro anterior, pero marcaste un aporte/retiro. ¿El valor ya incluye ese movimiento? Cancela para revisar el campo "valor".`
      );
      if (!confirma) {
        actualizarFila(fila.snapshotId, { resultado: "no guardado: revisa el valor" });
        return;
      }
    } else {
      const pct = estimarRendimientoPct(
        anterior,
        Number(estado.valor),
        estado.incluyeMovimiento,
        estado.movimientoTipo,
        estado.movimientoMonto
      );
      if (pct != null && Math.abs(pct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE) {
        const confirma = window.confirm(
          `Con este valor, el rendimiento sería de ${pct.toFixed(1)}% respecto al registro anterior — ¿el valor es correcto? Cancela para revisarlo.`
        );
        if (!confirma) {
          actualizarFila(fila.snapshotId, { resultado: "no guardado: revisa el valor" });
          return;
        }
      }
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
      // a diferencia de SnapshotForm (la carga del dia a dia), el historial es
      // exactamente el lugar pensado para corregir/quitar un movimiento a
      // proposito -- aca si se permite.
      p_permitir_quitar_movimiento: true,
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
              <InputMonto
                className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                value={estado.valor}
                onChange={(valor) => actualizarFila(fila.snapshotId, { valor, valorEditadoManualmente: true })}
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
                onChange={(e) => actualizarMovimiento(fila, { incluyeMovimiento: e.target.checked })}
              />
              esto incluye un aporte o retiro
            </label>

            {estado.incluyeMovimiento && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={estado.movimientoTipo}
                  onChange={(e) =>
                    actualizarMovimiento(fila, { movimientoTipo: e.target.value as TipoMovimiento })
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-sm bg-white"
                >
                  <option value="aporte">aporte</option>
                  <option value="retiro">retiro</option>
                </select>
                <InputMonto
                  placeholder="monto"
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                  value={estado.movimientoMonto}
                  onChange={(movimientoMonto) => actualizarMovimiento(fila, { movimientoMonto })}
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
