"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { InputMonto } from "@/components/InputMonto";
import { formatoFecha, formatoMontoNativo } from "@/lib/formato";
import { AlertTriangle } from "lucide-react";
// mismas formulas y advertencias que la carga rapida (con tests en
// src/lib/registro.test.ts); antes habia copias locales en este archivo.
import { advertenciaRegistro, calcularValorSugerido } from "@/lib/registro";
import type { Cuenta, TipoMovimiento } from "@/types/database";

interface FilaHistorial {
  snapshotId: string;
  fecha: string;
  valor: number;
  tasaCambio: number | null;
  nota: string | null;
  movimiento: { tipo: TipoMovimiento; monto: number } | null;
}

interface HistorialFormProps {
  cuenta: Cuenta;
  filas: FilaHistorial[];
}

interface FilaState {
  valor: string;
  tasaCambio: string;
  nota: string;
  incluyeMovimiento: boolean;
  movimientoTipo: TipoMovimiento;
  movimientoMonto: string;
  guardando: boolean;
  resultado: "ok" | string | null;
  // advertencia pendiente de confirmar en pantalla (antes window.confirm)
  aviso: string | null;
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
    nota: fila.nota ?? "",
    incluyeMovimiento: !!fila.movimiento,
    movimientoTipo: fila.movimiento?.tipo ?? "aporte",
    movimientoMonto: fila.movimiento ? String(fila.movimiento.monto) : "",
    guardando: false,
    resultado: null,
    aviso: null,
    valorEditadoManualmente: false,
    tieneMovimientoOriginal: !!fila.movimiento,
  };
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
  "h-9 px-2.5 rounded-[8px] border border-control text-right text-small font-mono-tabular bg-tint/[0.04] text-fg focus:outline-none focus:border-accent-ink focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

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

  // forzar=true: el usuario ya vio la advertencia y eligio guardar igual
  async function guardarFila(fila: FilaHistorial, forzar = false) {
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

    const anterior = valorAnteriorPorFila[fila.snapshotId] ?? null;
    if (!forzar) {
      // en el historial, desmarcar un aporte/retiro existente lo BORRA
      // (p_permitir_quitar_movimiento: true). se pide confirmacion explicita:
      // borrar un aporte real fue el incidente de perdida de datos de CLAUDE.md.
      const borraMovimiento = estado.tieneMovimientoOriginal && !estado.incluyeMovimiento && fila.movimiento;
      const aviso = borraMovimiento
        ? `Al guardar se eliminará el ${fila.movimiento!.tipo} de ${formatoMontoNativo(fila.movimiento!.monto, cuenta.moneda)} registrado este día. Hazlo solo si fue un error.`
        : advertenciaRegistro({
            nombreCuenta: cuenta.nombre,
            valorAnterior: anterior,
            valorNuevo: Number(estado.valor),
            incluyeMovimiento: estado.incluyeMovimiento,
            tipo: estado.movimientoTipo,
            monto: estado.movimientoMonto,
          });
      if (aviso) {
        actualizarFila(fila.snapshotId, { aviso, resultado: null });
        return;
      }
    }

    actualizarFila(fila.snapshotId, { guardando: true, resultado: null, aviso: null });
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
      // siempre se manda el valor actual del campo, nunca lo que habia antes
      // de que el usuario lo viera -- mismo principio que ya protege
      // valor/tasaCambio en este mismo formulario (fila.nota ya precarga el
      // input, asi que borrarlo aca es una decision deliberada, no un accidente).
      p_nota: estado.nota.trim() || undefined,
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
      <div className="card p-6">
        <p className="text-small text-fg-muted">Todavía no hay historial para esta cuenta.</p>
      </div>
    );
  }

  return (
    <ul className="card lista-filas px-4 sm:px-5">
      {filas.map((fila) => {
        const estado = estados[fila.snapshotId];
        const id = `hist-${fila.snapshotId}`;
        const fecha = formatoFecha(fila.fecha);
        return (
          <li key={fila.snapshotId} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={`${id}-valor`} className="text-small font-semibold text-fg">
                <span className="font-mono-tabular">{fecha}</span>
                <span className="sr-only">, valor en {cuenta.moneda}</span>
              </label>
              <InputMonto
                id={`${id}-valor`}
                className={`w-36 ${inputClass}`}
                value={estado.valor}
                onChange={(valor) => actualizarFila(fila.snapshotId, { valor, valorEditadoManualmente: true })}
              />
            </div>

            {cuenta.moneda !== "CLP" && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <label htmlFor={`${id}-tasa`} className="text-micro text-fg-muted">
                  Tasa {cuenta.moneda} en pesos<span className="sr-only"> del {fecha}</span>
                </label>
                <input
                  id={`${id}-tasa`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={`w-32 ${inputClass}`}
                  value={estado.tasaCambio}
                  onChange={(e) => actualizarFila(fila.snapshotId, { tasaCambio: e.target.value })}
                />
              </div>
            )}

            <label className="mt-2.5 flex items-center gap-2 text-micro text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={estado.incluyeMovimiento}
                onChange={(e) => actualizarMovimiento(fila, { incluyeMovimiento: e.target.checked })}
                className="w-[15px] h-[15px] accent-[var(--accent)]"
              />
              Esto incluye un aporte o retiro<span className="sr-only"> el {fecha}</span>
            </label>

            {estado.incluyeMovimiento && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  aria-label={`Tipo de movimiento del ${fecha}`}
                  value={estado.movimientoTipo}
                  onChange={(e) =>
                    actualizarMovimiento(fila, { movimientoTipo: e.target.value as TipoMovimiento })
                  }
                  className="h-9 px-2 rounded-[8px] border border-control text-small bg-tint/[0.04] text-fg focus:outline-none focus:border-accent-ink focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                >
                  <option value="aporte">Aporte</option>
                  <option value="retiro">Retiro</option>
                </select>
                <InputMonto
                  ariaLabel={`Monto del ${estado.movimientoTipo} del ${fecha}`}
                  placeholder="Monto"
                  className={`flex-1 min-w-[100px] ${inputClass}`}
                  value={estado.movimientoMonto}
                  onChange={(movimientoMonto) => actualizarMovimiento(fila, { movimientoMonto })}
                />
              </div>
            )}

            <label className="mt-2.5 flex flex-col gap-1">
              <span className="text-micro text-fg-muted">
                Nota (opcional)<span className="sr-only"> del {fecha}</span>
              </span>
              <input
                type="text"
                placeholder="ej. caída del mercado"
                value={estado.nota}
                onChange={(e) => actualizarFila(fila.snapshotId, { nota: e.target.value })}
                className="h-9 px-2.5 rounded-[8px] border border-control text-small bg-tint/[0.04] text-fg focus:outline-none focus:border-accent-ink focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
              />
            </label>

            <button
              onClick={() => guardarFila(fila)}
              disabled={estado.guardando}
              className="boton-secundario mt-3 h-9 w-full disabled:opacity-50"
            >
              {estado.guardando ? "Guardando…" : <>Guardar<span className="sr-only"> el registro del {fecha}</span></>}
            </button>

            {estado.aviso && (
              <div role="alertdialog" aria-label="Revisa antes de guardar" className="mt-3 rounded-xl border border-warn/40 bg-warn/10 p-3">
                <p className="flex gap-2 text-small leading-snug text-fg">
                  <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warn" />
                  {estado.aviso}
                </p>
                <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row">
                  <button type="button" onClick={() => actualizarFila(fila.snapshotId, { aviso: null })} className="boton-secundario flex-1">
                    Revisar
                  </button>
                  <button type="button" onClick={() => guardarFila(fila, true)} className="boton-primario flex-1">
                    Guardar igual
                  </button>
                </div>
              </div>
            )}

            {estado.resultado === "ok" && (
              <p role="status" className="mt-2 text-micro font-medium text-pos">
                Guardado
              </p>
            )}
            {estado.resultado && estado.resultado !== "ok" && (
              <p role="alert" className="mt-2 text-micro text-neg">{estado.resultado}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
