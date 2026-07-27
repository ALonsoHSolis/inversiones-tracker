"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InputMonto } from "@/components/InputMonto";
import { formatoFecha } from "@/lib/formato";
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

// nunca mostrar error.message crudo de postgres/supabase -- mismo criterio
// ya aplicado en CuentaForm/EditarCuentaForm/CuentasInactivas.
function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo guardar. Intenta de nuevo o escríbenos si el problema persiste";
}

const inputClass =
  "h-9 px-2.5 rounded-[8px] border border-white/[0.14] text-right text-[13px] font-mono-tabular bg-white/[0.04] text-[#F2F5F9] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

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
      console.error("guardar_snapshot_con_movimiento:", error.message);
      actualizarFila(fila.snapshotId, { guardando: false, resultado: mensajeErrorAmigable(error.message) });
      return;
    }
    actualizarFila(fila.snapshotId, { guardando: false, resultado: "ok" });
  }

  if (filas.length === 0) {
    return (
      <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6">
        <p className="text-[13.5px] text-[#8892A0]">todavía no hay historial para esta cuenta.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {filas.map((fila) => {
        const estado = estados[fila.snapshotId];
        return (
          <div
            key={fila.snapshotId}
            className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.5)]"
          >
            <p className="text-[11px] text-[#5B6472] font-mono-tabular mb-2">{formatoFecha(fila.fecha)}</p>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-[#8892A0]">valor</span>
              <InputMonto
                className={`w-32 ${inputClass}`}
                value={estado.valor}
                onChange={(valor) => actualizarFila(fila.snapshotId, { valor, valorEditadoManualmente: true })}
              />
            </div>

            {cuenta.moneda !== "CLP" && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-[#8892A0]">tasa de cambio</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={`w-32 ${inputClass}`}
                  value={estado.tasaCambio}
                  onChange={(e) => actualizarFila(fila.snapshotId, { tasaCambio: e.target.value })}
                />
              </div>
            )}

            <label className="mt-2.5 flex items-center gap-2 text-[12px] text-[#8892A0] cursor-pointer">
              <input
                type="checkbox"
                checked={estado.incluyeMovimiento}
                onChange={(e) => actualizarMovimiento(fila, { incluyeMovimiento: e.target.checked })}
                className="w-[15px] h-[15px] accent-[var(--accent)]"
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
                  className="h-9 px-2 rounded-[8px] border border-white/[0.14] text-[13px] bg-white/[0.04] text-[#F2F5F9] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                >
                  <option value="aporte">aporte</option>
                  <option value="retiro">retiro</option>
                </select>
                <InputMonto
                  placeholder="monto"
                  className={`flex-1 min-w-[100px] ${inputClass}`}
                  value={estado.movimientoMonto}
                  onChange={(movimientoMonto) => actualizarMovimiento(fila, { movimientoMonto })}
                />
              </div>
            )}

            <button
              onClick={() => guardarFila(fila)}
              disabled={estado.guardando}
              className="mt-3 h-9 w-full rounded-[8px] bg-[var(--accent)] text-[#0A0D13] text-[13px] font-semibold disabled:opacity-50"
            >
              {estado.guardando ? "guardando..." : "guardar"}
            </button>

            {estado.resultado === "ok" && (
              <p className="mt-2 text-[12px] font-medium" style={{ color: "var(--pos)" }}>
                guardado
              </p>
            )}
            {estado.resultado && estado.resultado !== "ok" && (
              <p className="mt-2 text-[12px] text-[var(--neg)]">{estado.resultado}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
