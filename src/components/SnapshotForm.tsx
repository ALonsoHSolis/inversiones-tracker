"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { Ayuda } from "@/components/Ayuda";
import { InputMonto } from "@/components/InputMonto";
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

    // dos chequeos antes de guardar, del mas especifico al mas general -- si
    // el primero aplica, no se muestra tambien el segundo por el mismo
    // problema de fondo:
    // 1) valor sin cambio pero con aporte/retiro marcado -- probablemente el
    //    aporte nunca quedo sumado al valor.
    // 2) el % de rendimiento que resultaria es implausible (ej. -95%) --
    //    probablemente un typo en el valor o en el monto del aporte.
    const aGuardar = pendientes.filter((cuenta) => {
      const fila = filas[cuenta.id];
      const anterior = valorAnteriorPorCuenta[cuenta.id];
      const valorSinCambio = fila.incluyeMovimiento && anterior != null && Number(fila.valor) === anterior;

      if (valorSinCambio) {
        const confirma = window.confirm(
          `El valor de "${cuenta.nombre}" no cambió respecto al último registro, pero marcaste un aporte/retiro. ¿El valor ya incluye ese movimiento? Cancela para revisar el campo "valor".`
        );
        if (!confirma) actualizarFila(cuenta.id, { resultado: "no guardado: revisa el valor" });
        return confirma;
      }

      const pct = estimarRendimientoPct(
        anterior,
        Number(fila.valor),
        fila.incluyeMovimiento,
        fila.movimientoTipo,
        fila.movimientoMonto
      );
      if (pct != null && Math.abs(pct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE) {
        const confirma = window.confirm(
          `Con este valor, el rendimiento de "${cuenta.nombre}" sería de ${pct.toFixed(1)}% respecto al registro anterior — ¿el valor es correcto? Cancela para revisarlo.`
        );
        if (!confirma) actualizarFila(cuenta.id, { resultado: "no guardado: revisa el valor" });
        return confirma;
      }

      return true;
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
        if (cuenta.moneda !== "CLP" && !(Number(fila.tasaCambio) > 0)) {
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
    <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold">Actualizar valores de hoy</p>
        <Ayuda>
          Escribe el valor de hoy de cada cuenta (lo que ves en el banco o corredora), o usa &quot;sin
          cambios&quot; si sigue igual que el último registro. Si además depositaste o retiraste plata
          — no una variación de mercado — usa &quot;+ añadir aporte o retiro&quot; para que ese monto no
          se cuente como ganancia.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#A0A7B2] mb-4">Fecha de hoy: {formatoFecha(new Date().toISOString())}</p>
      {/* una sola columna a proposito, sin breakpoint de viewport: este
          formulario vive dentro de un sidebar angosto (ver page.tsx), y
          sm:grid-cols-2 se activaba por el ancho de la ventana, no del
          contenedor -- con dos columnas ahi el select+monto de cada card no
          alcanzaban a caber y se desbordaban sobre la tarjeta vecina. */}
      <div className="flex flex-col gap-3">
        {cuentas.map((cuenta) => {
          const fila = filas[cuenta.id] ?? filaInicial();
          const anterior = valorAnteriorPorCuenta[cuenta.id];
          return (
            <div key={cuenta.id} className="rounded-xl border border-[#ECEEF2] p-3.5 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-[#2C333B] truncate">{cuenta.nombre}</span>
                {anterior != null && (
                  <button
                    type="button"
                    onClick={() =>
                      actualizarFila(cuenta.id, { valor: String(anterior), valorEditadoManualmente: true })
                    }
                    className="text-[11px] text-[#98A0AB] border-b border-[#E2E5EA] shrink-0"
                  >
                    sin cambios
                  </button>
                )}
              </div>

              <InputMonto
                placeholder="0"
                className="mt-2.5 w-full h-10 px-3 rounded-[10px] border border-[#DFE2E8] text-right text-[13px] font-mono-tabular focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                value={fila.valor}
                onChange={(valor) => actualizarFila(cuenta.id, { valor, valorEditadoManualmente: true })}
              />

              {cuenta.moneda !== "CLP" && (
                <div className="mt-2.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[#6B7280]">tasa de cambio</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="w-28 h-8 px-2 rounded-lg border border-[#DFE2E8] text-right text-[13px] font-mono-tabular focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                      value={fila.tasaCambio ?? ""}
                      onChange={(e) =>
                        editarTasaManualmente(cuenta.id, e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                  {fila.cargandoTasa && (
                    <span className="text-[11px] text-[#A0A7B2] text-right">buscando tasa en mindicador.cl…</span>
                  )}
                  {!fila.cargandoTasa && fila.tasaFecha && (
                    <span className="text-[11px] text-[#A0A7B2] text-right">
                      según Banco Central, {formatoFecha(fila.tasaFecha)}
                    </span>
                  )}
                  {fila.errorTasa && (
                    <span className="text-[11px] text-[var(--neg)] flex items-center justify-end gap-2">
                      {fila.errorTasa}
                      <button type="button" onClick={() => cargarTasa(cuenta)} className="underline shrink-0">
                        reintentar
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* revelacion progresiva: el aporte/retiro empieza oculto detras
                  de un boton secundario -- por defecto solo se ve el input de
                  valor, para no saturar la pantalla cuando la mayoria de los
                  dias no hay ningun movimiento que registrar. */}
              {!fila.incluyeMovimiento ? (
                <button
                  type="button"
                  onClick={() => actualizarMovimiento(cuenta, { incluyeMovimiento: true })}
                  className="mt-2.5 self-start text-[11.5px] font-semibold text-[var(--accent)]"
                >
                  + añadir aporte o retiro
                </button>
              ) : (
                <div className="mt-2.5 rounded-[10px] bg-[#F7F8FA] p-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#6B7280]">esto incluye un aporte o retiro</span>
                    <button
                      type="button"
                      onClick={() => actualizarMovimiento(cuenta, { incluyeMovimiento: false })}
                      className="text-[11px] text-[#98A0AB] border-b border-[#E2E5EA] shrink-0"
                    >
                      quitar
                    </button>
                  </div>
                  {fila.tieneMovimientoOriginal && (
                    <span className="self-start text-[10px] font-medium text-[#8A929E] bg-white border border-[#E2E5EA] rounded px-1.5 py-px">
                      ya registrado hoy
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <select
                      value={fila.movimientoTipo}
                      onChange={(e) =>
                        actualizarMovimiento(cuenta, { movimientoTipo: e.target.value as TipoMovimiento })
                      }
                      className="h-9 px-2 rounded-lg border border-[#DFE2E8] text-[13px] bg-white shrink-0"
                    >
                      <option value="aporte">aporte</option>
                      <option value="retiro">retiro</option>
                    </select>
                    <InputMonto
                      placeholder="monto"
                      className="flex-1 min-w-0 h-9 px-2.5 rounded-lg border border-[#DFE2E8] text-right text-[13px] font-mono-tabular bg-white focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
                      value={fila.movimientoMonto}
                      onChange={(movimientoMonto) => actualizarMovimiento(cuenta, { movimientoMonto })}
                    />
                  </div>
                </div>
              )}

              {fila.resultado === "ok" && (
                <p className="mt-2 text-[11.5px] font-semibold text-[var(--pos)]">✓ guardado</p>
              )}
              {fila.resultado && fila.resultado !== "ok" && (
                <p className="mt-2 text-[11.5px] text-[var(--neg)]">{fila.resultado}</p>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={guardarSnapshots}
        disabled={guardando || algunaCargandoTasa}
        className="w-full h-[42px] mt-4 rounded-[11px] bg-[var(--accent)] text-white text-[13.5px] font-semibold disabled:opacity-50 hover:brightness-[1.08]"
      >
        {guardando ? "Guardando…" : "Guardar registros"}
      </button>
      {resumen && <p className="text-[12px] font-semibold text-center text-[#40474F] mt-2.5">{resumen}</p>}
    </section>
  );
}
