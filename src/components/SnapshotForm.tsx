"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import type { Cuenta, Moneda, TipoMovimiento } from "@/types/database";

interface SnapshotFormProps {
  cuentas: Cuenta[];
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
}

interface FilaState {
  valor: string;
  tasaCambio: number | null;
  tasaFecha: string | null;
  cargandoTasa: boolean;
  errorTasa: string | null;
  incluyeMovimiento: boolean;
  movimientoTipo: TipoMovimiento;
  movimientoMonto: string;
  resultado: "ok" | string | null;
}

function filaInicial(seed?: { tipo: TipoMovimiento; monto: number }): FilaState {
  return {
    valor: "",
    tasaCambio: null,
    tasaFecha: null,
    cargandoTasa: false,
    errorTasa: null,
    incluyeMovimiento: !!seed,
    movimientoTipo: seed?.tipo ?? "aporte",
    movimientoMonto: seed ? String(seed.monto) : "",
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

export function SnapshotForm({ cuentas, movimientosHoy }: SnapshotFormProps) {
  const [filas, setFilas] = useState<Record<string, FilaState>>(() =>
    Object.fromEntries(cuentas.map((c) => [c.id, filaInicial(movimientosHoy[c.id])]))
  );
  const [guardando, setGuardando] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);

  function actualizarFila(cuentaId: string, patch: Partial<FilaState>) {
    setFilas((prev) => ({
      ...prev,
      [cuentaId]: { ...filaInicial(), ...prev[cuentaId], ...patch },
    }));
  }

  // mismo patron anti-condicion-de-carrera que CuentaForm.tsx (tasaRequestId),
  // pero un contador por cuenta_id en vez de uno solo, porque aca hay varias
  // filas independientes en vez de una sola moneda seleccionable.
  const tasaRequestIds = useRef<Record<string, number>>({});

  async function cargarTasa(cuenta: Cuenta) {
    if (cuenta.moneda === "CLP") return;
    const requestId = (tasaRequestIds.current[cuenta.id] = (tasaRequestIds.current[cuenta.id] ?? 0) + 1);
    actualizarFila(cuenta.id, { cargandoTasa: true, errorTasa: null });

    try {
      const { valor, fecha } = await obtenerTasaCambio(cuenta.moneda as Exclude<Moneda, "CLP">);
      if (tasaRequestIds.current[cuenta.id] !== requestId) return;
      actualizarFila(cuenta.id, { tasaCambio: valor, tasaFecha: fecha, cargandoTasa: false });
    } catch (err) {
      if (tasaRequestIds.current[cuenta.id] !== requestId) return;
      console.error(err);
      actualizarFila(cuenta.id, {
        tasaCambio: null,
        tasaFecha: null,
        cargandoTasa: false,
        errorTasa: "no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo",
      });
    }
  }

  function editarTasaManualmente(cuentaId: string, valor: number | null) {
    tasaRequestIds.current[cuentaId] = (tasaRequestIds.current[cuentaId] ?? 0) + 1;
    actualizarFila(cuentaId, { tasaCambio: valor, cargandoTasa: false, errorTasa: null });
  }

  useEffect(() => {
    cuentas.forEach((cuenta) => {
      if (cuenta.moneda !== "CLP") cargarTasa(cuenta);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardarSnapshots() {
    setGuardando(true);
    setResumen(null);
    const supabase = createClient();
    const hoy = new Date().toISOString().slice(0, 10);

    const pendientes = cuentas.filter((c) => (filas[c.id]?.valor ?? "").trim() !== "");

    if (pendientes.length === 0) {
      setGuardando(false);
      return;
    }

    const resultados = await Promise.allSettled(
      pendientes.map(async (cuenta) => {
        const fila = filas[cuenta.id];

        if (cuenta.moneda !== "CLP" && fila.tasaCambio == null) {
          throw new Error("falta la tasa de cambio");
        }
        if (fila.incluyeMovimiento && !(Number(fila.movimientoMonto) > 0)) {
          throw new Error("el monto del aporte/retiro debe ser mayor a cero");
        }

        const { error } = await supabase.rpc("guardar_snapshot_con_movimiento", {
          p_cuenta_id: cuenta.id,
          p_fecha: hoy,
          p_valor: Number(fila.valor),
          p_tasa_cambio: cuenta.moneda === "CLP" ? undefined : (fila.tasaCambio ?? undefined),
          p_movimiento_tipo: fila.incluyeMovimiento ? fila.movimientoTipo : undefined,
          p_movimiento_monto: fila.incluyeMovimiento ? Number(fila.movimientoMonto) : undefined,
        });

        if (error) throw new Error(error.message);
        return cuenta.id;
      })
    );

    let ok = 0;
    let fallidas = 0;

    resultados.forEach((res, i) => {
      const cuentaId = pendientes[i].id;
      if (res.status === "fulfilled") {
        ok++;
        actualizarFila(cuentaId, { valor: "", incluyeMovimiento: false, movimientoMonto: "", resultado: "ok" });
      } else {
        fallidas++;
        actualizarFila(cuentaId, { resultado: res.reason?.message ?? "hubo un error al guardar" });
      }
    });

    setGuardando(false);
    setResumen(
      fallidas === 0
        ? `${ok} cuenta${ok === 1 ? "" : "s"} guardada${ok === 1 ? "" : "s"}`
        : `${ok} guardada${ok === 1 ? "" : "s"}, ${fallidas} con error`
    );
  }

  if (cuentas.length === 0) return null;

  const algunaCargandoTasa = Object.values(filas).some((f) => f.cargandoTasa);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium mb-3">actualizar valores de hoy</p>
      <div className="flex flex-col gap-3">
        {cuentas.map((cuenta) => {
          const fila = filas[cuenta.id] ?? filaInicial();
          return (
            <div key={cuenta.id} className="rounded border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-600">{cuenta.nombre}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                  value={fila.valor}
                  onChange={(e) => actualizarFila(cuenta.id, { valor: e.target.value })}
                />
              </div>

              {cuenta.moneda !== "CLP" && (
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500">tasa de cambio</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                      value={fila.tasaCambio ?? ""}
                      onChange={(e) =>
                        editarTasaManualmente(cuenta.id, e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                  {fila.cargandoTasa && (
                    <span className="text-xs text-gray-500 text-right">buscando tasa en mindicador.cl...</span>
                  )}
                  {!fila.cargandoTasa && fila.tasaFecha && (
                    <span className="text-xs text-gray-500 text-right">
                      segun Banco Central, {formatoFecha(fila.tasaFecha)}
                    </span>
                  )}
                  {fila.errorTasa && (
                    <span className="text-xs text-red-700 flex items-center justify-end gap-2">
                      {fila.errorTasa}
                      <button type="button" onClick={() => cargarTasa(cuenta)} className="underline shrink-0">
                        reintentar
                      </button>
                    </span>
                  )}
                </div>
              )}

              <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={fila.incluyeMovimiento}
                  onChange={(e) => actualizarFila(cuenta.id, { incluyeMovimiento: e.target.checked })}
                />
                esto incluye un aporte o retiro
              </label>

              {fila.incluyeMovimiento && (
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={fila.movimientoTipo}
                    onChange={(e) =>
                      actualizarFila(cuenta.id, { movimientoTipo: e.target.value as TipoMovimiento })
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
                    value={fila.movimientoMonto}
                    onChange={(e) => actualizarFila(cuenta.id, { movimientoMonto: e.target.value })}
                  />
                </div>
              )}

              {fila.resultado === "ok" && <p className="mt-2 text-xs text-green-700">guardado</p>}
              {fila.resultado && fila.resultado !== "ok" && (
                <p className="mt-2 text-xs text-red-700">{fila.resultado}</p>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={guardarSnapshots}
        disabled={guardando || algunaCargandoTasa}
        className="mt-4 w-full rounded bg-gray-900 text-white text-sm py-2 disabled:opacity-50"
      >
        {guardando ? "guardando..." : "guardar"}
      </button>
      {resumen && <p className="text-xs text-gray-500 mt-2">{resumen}</p>}
    </div>
  );
}
