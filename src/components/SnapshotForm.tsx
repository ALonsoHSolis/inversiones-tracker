"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { Ayuda } from "@/components/Ayuda";
import type { Cuenta, Moneda, TipoMovimiento } from "@/types/database";

interface SnapshotFormProps {
  cuentas: Cuenta[];
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
  // valor_actual (moneda nativa) de capital_por_cuenta -- se usa para sugerir
  // el valor de hoy al marcar un aporte/retiro nuevo, y para advertir si el
  // valor no cambio pese a haber uno marcado.
  valorAnteriorPorCuenta: Record<string, number | null>;
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
  // true si el usuario escribio directo en "valor" -- una vez en true, la
  // sugerencia automatica deja de tocar el campo (nunca pisa una edicion manual).
  valorEditadoManualmente: boolean;
  // true si esta fila ya tenia un aporte/retiro guardado al cargar la
  // pantalla (viene de movimientosHoy) -- la sugerencia automatica nunca se
  // activa en estos casos, porque "valor" probablemente ya lo refleja de un
  // guardado anterior y recalcularlo podria pisar un numero correcto.
  tieneMovimientoOriginal: boolean;
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
    valorEditadoManualmente: false,
    tieneMovimientoOriginal: !!seed,
  };
}

function calcularValorSugerido(valorAnterior: number | null, monto: string, tipo: TipoMovimiento): string {
  const base = valorAnterior ?? 0;
  const montoNum = Number(monto) || 0;
  const sugerido = tipo === "aporte" ? base + montoNum : base - montoNum;
  return String(sugerido);
}

function formatoFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SnapshotForm({ cuentas, movimientosHoy, valorAnteriorPorCuenta }: SnapshotFormProps) {
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

  // la sugerencia solo aplica a un aporte/retiro NUEVO en esta edicion: si la
  // fila ya tenia un movimiento al cargar la pantalla, o el usuario ya edito
  // "valor" a mano, nunca se recalcula solo.
  function actualizarMovimiento(cuenta: Cuenta, patch: Partial<FilaState>) {
    const fila = filas[cuenta.id];
    const siguiente = { ...fila, ...patch };
    const debeSugerir =
      siguiente.incluyeMovimiento && !fila.tieneMovimientoOriginal && !fila.valorEditadoManualmente;
    if (debeSugerir) {
      patch.valor = calcularValorSugerido(
        valorAnteriorPorCuenta[cuenta.id] ?? null,
        siguiente.movimientoMonto,
        siguiente.movimientoTipo
      );
    }
    actualizarFila(cuenta.id, patch);
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
    setResumen(null);

    const pendientes = cuentas.filter((c) => (filas[c.id]?.valor ?? "").trim() !== "");

    if (pendientes.length === 0) return;

    // si el valor no cambio respecto al ultimo registro pero hay un
    // aporte/retiro marcado, confirmar antes de guardar -- es la situacion
    // exacta que puede esconder un aporte que nunca quedo sumado al valor.
    const aGuardar = pendientes.filter((cuenta) => {
      const fila = filas[cuenta.id];
      const anterior = valorAnteriorPorCuenta[cuenta.id];
      const valorSinCambio = fila.incluyeMovimiento && anterior != null && Number(fila.valor) === anterior;
      if (!valorSinCambio) return true;

      const confirma = window.confirm(
        `El valor de "${cuenta.nombre}" no cambió respecto al último registro, pero marcaste un aporte/retiro. ¿El valor ya incluye ese movimiento? Cancela para revisar el campo "valor".`
      );
      if (!confirma) {
        actualizarFila(cuenta.id, { resultado: "no guardado: revisa el valor" });
      }
      return confirma;
    });

    if (aGuardar.length === 0) return;

    setGuardando(true);
    const supabase = createClient();
    const hoy = new Date().toISOString().slice(0, 10);

    const resultados = await Promise.allSettled(
      aGuardar.map(async (cuenta) => {
        const fila = filas[cuenta.id];

        if (Number(fila.valor) < 0) {
          throw new Error("el valor no puede ser negativo");
        }
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
          // la carga del dia a dia nunca debe poder borrar un aporte/retiro ya
          // registrado (por ejemplo, el aporte inicial de una cuenta creada
          // hoy mismo) -- desmarcar la casilla pensando "no estoy depositando
          // ahora" es un error muy facil de cometer. borrar uno existente
          // queda solo para el historial de la cuenta, una accion deliberada.
          p_permitir_quitar_movimiento: false,
        });

        if (error) throw new Error(error.message);
        return cuenta.id;
      })
    );

    let ok = 0;
    let fallidas = 0;

    resultados.forEach((res, i) => {
      const cuentaId = aGuardar[i].id;
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
      <div className="mb-3">
        <p className="text-sm font-medium">actualizar valores de hoy</p>
        <Ayuda>
          Escribe el valor de hoy de cada cuenta (lo que ves en el banco o corredora). Si además
          depositaste o retiraste plata desde el último registro — no una variación de mercado —
          marca "esto incluye un aporte o retiro" para que ese monto no se cuente como ganancia.
        </Ayuda>
      </div>
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
                  min={0}
                  className="w-32 rounded border border-gray-300 px-2 py-1 text-right"
                  value={fila.valor}
                  onChange={(e) =>
                    actualizarFila(cuenta.id, { valor: e.target.value, valorEditadoManualmente: true })
                  }
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
                  onChange={(e) => actualizarMovimiento(cuenta, { incluyeMovimiento: e.target.checked })}
                />
                esto incluye un aporte o retiro
              </label>

              {fila.incluyeMovimiento && (
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={fila.movimientoTipo}
                    onChange={(e) =>
                      actualizarMovimiento(cuenta, { movimientoTipo: e.target.value as TipoMovimiento })
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
                    onChange={(e) => actualizarMovimiento(cuenta, { movimientoMonto: e.target.value })}
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
