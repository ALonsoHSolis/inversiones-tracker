"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { Ayuda } from "@/components/Ayuda";
import { InputMonto } from "@/components/InputMonto";
import type { Cuenta, Moneda, TipoMovimiento } from "@/types/database";

interface CargaRapidaProps {
  cuentas: Cuenta[];
  movimientosHoy: Record<string, { tipo: TipoMovimiento; monto: number }>;
  // valor_actual (moneda nativa) de capital_por_cuenta -- mismo dato que ya
  // usa SnapshotForm para sugerir el valor y advertir si no cambio.
  valorAnteriorPorCuenta: Record<string, number | null>;
}

// mismas formulas que SnapshotForm.tsx (espejo de rendimiento_semanal en
// schema.sql) -- duplicadas a proposito, siguiendo la convencion ya
// establecida en este proyecto de no compartir estos helpers chicos entre
// formularios.
function calcularValorSugerido(valorAnterior: number | null, monto: string, tipo: TipoMovimiento): string {
  const base = valorAnterior ?? 0;
  const montoNum = Number(monto) || 0;
  return String(tipo === "aporte" ? base + montoNum : base - montoNum);
}

const UMBRAL_RENDIMIENTO_IMPLAUSIBLE = 80;

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

// version de una sola cuenta de SnapshotForm: para cuando actualizar TODAS
// las cuentas de una vez (el grid completo) es mas friccion de la que hace
// falta ese dia -- el caso comun es actualizar una o dos cuentas, no todas.
// misma logica de guardado, guardrails y rpc que SnapshotForm, solo que
// aplicada a una cuenta elegida en un desplegable en vez de a todas a la vez.
export function CargaRapida({ cuentas, movimientosHoy, valorAnteriorPorCuenta }: CargaRapidaProps) {
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const cuenta = cuentas.find((c) => c.id === cuentaId) ?? null;

  const [valor, setValor] = useState("");
  const [valorEditadoManualmente, setValorEditadoManualmente] = useState(false);
  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [tasaFecha, setTasaFecha] = useState<string | null>(null);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);
  const [incluyeMovimiento, setIncluyeMovimiento] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<TipoMovimiento>("aporte");
  const [movimientoMonto, setMovimientoMonto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<"ok" | string | null>(null);

  const tieneMovimientoOriginal = !!(cuenta && movimientosHoy[cuenta.id]);
  const tasaRequestId = useRef(0);

  async function cargarTasa(c: Cuenta) {
    const requestId = ++tasaRequestId.current;
    setCargandoTasa(true);
    setErrorTasa(null);
    try {
      const { valor: v, fecha } = await obtenerTasaCambio(c.moneda as Exclude<Moneda, "CLP">);
      if (tasaRequestId.current !== requestId) return;
      setTasaCambio(v);
      setTasaFecha(fecha);
      setCargandoTasa(false);
    } catch (err) {
      if (tasaRequestId.current !== requestId) return;
      console.error(err);
      setTasaCambio(null);
      setTasaFecha(null);
      setCargandoTasa(false);
      setErrorTasa("no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo");
    }
  }

  function editarTasaManualmente(v: number | null) {
    tasaRequestId.current++;
    setTasaCambio(v);
    setCargandoTasa(false);
    setErrorTasa(null);
  }

  // al cambiar de cuenta, reiniciar todo el formulario -- si la cuenta
  // elegida ya tiene un aporte/retiro registrado hoy, precargarlo (mismo
  // criterio que el seed de SnapshotForm).
  useEffect(() => {
    tasaRequestId.current++;
    const seed = cuenta ? movimientosHoy[cuenta.id] : undefined;
    setValor("");
    setValorEditadoManualmente(false);
    setTasaCambio(null);
    setTasaFecha(null);
    setErrorTasa(null);
    setCargandoTasa(false);
    setIncluyeMovimiento(!!seed);
    setMovimientoTipo(seed?.tipo ?? "aporte");
    setMovimientoMonto(seed ? String(seed.monto) : "");
    setResultado(null);

    if (cuenta && cuenta.moneda !== "CLP") cargarTasa(cuenta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuentaId]);

  function cambiarMovimiento(patch: {
    incluyeMovimiento?: boolean;
    movimientoTipo?: TipoMovimiento;
    movimientoMonto?: string;
  }) {
    const siguienteIncluye = patch.incluyeMovimiento ?? incluyeMovimiento;
    const siguienteTipo = patch.movimientoTipo ?? movimientoTipo;
    const siguienteMonto = patch.movimientoMonto ?? movimientoMonto;

    if (patch.incluyeMovimiento !== undefined) setIncluyeMovimiento(patch.incluyeMovimiento);
    if (patch.movimientoTipo !== undefined) setMovimientoTipo(patch.movimientoTipo);
    if (patch.movimientoMonto !== undefined) setMovimientoMonto(patch.movimientoMonto);

    const debeSugerir = siguienteIncluye && !tieneMovimientoOriginal && !valorEditadoManualmente;
    if (debeSugerir && cuenta) {
      setValor(calcularValorSugerido(valorAnteriorPorCuenta[cuenta.id] ?? null, siguienteMonto, siguienteTipo));
    }
  }

  async function guardar() {
    if (!cuenta) return;
    setResultado(null);

    if (valor.trim() === "") {
      setResultado("escribe un valor");
      return;
    }

    const anterior = valorAnteriorPorCuenta[cuenta.id];
    const valorSinCambio = incluyeMovimiento && anterior != null && Number(valor) === anterior;

    if (valorSinCambio) {
      const confirma = window.confirm(
        `El valor de "${cuenta.nombre}" no cambió respecto al último registro, pero marcaste un aporte/retiro. ¿El valor ya incluye ese movimiento? Cancela para revisar el campo "valor actual".`
      );
      if (!confirma) {
        setResultado("no guardado: revisa el valor");
        return;
      }
    } else {
      const pct = estimarRendimientoPct(anterior, Number(valor), incluyeMovimiento, movimientoTipo, movimientoMonto);
      if (pct != null && Math.abs(pct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE) {
        const confirma = window.confirm(
          `Con este valor, el rendimiento de "${cuenta.nombre}" sería de ${pct.toFixed(1)}% respecto al registro anterior — ¿el valor es correcto? Cancela para revisarlo.`
        );
        if (!confirma) {
          setResultado("no guardado: revisa el valor");
          return;
        }
      }
    }

    if (Number(valor) < 0) {
      setResultado("el valor no puede ser negativo");
      return;
    }
    if (cuenta.moneda !== "CLP" && !(Number(tasaCambio) > 0)) {
      setResultado("falta la tasa de cambio");
      return;
    }
    if (incluyeMovimiento && !(Number(movimientoMonto) > 0)) {
      setResultado("el monto del aporte/retiro debe ser mayor a cero");
      return;
    }

    setGuardando(true);
    const supabase = createClient();
    const hoy = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.rpc("guardar_snapshot_con_movimiento", {
      p_cuenta_id: cuenta.id,
      p_fecha: hoy,
      p_valor: Number(valor),
      p_tasa_cambio: cuenta.moneda === "CLP" ? undefined : (tasaCambio ?? undefined),
      p_movimiento_tipo: incluyeMovimiento ? movimientoTipo : undefined,
      p_movimiento_monto: incluyeMovimiento ? Number(movimientoMonto) : undefined,
      // misma regla que SnapshotForm: la carga del dia a dia nunca borra un
      // aporte/retiro ya registrado -- borrar uno a proposito queda solo en
      // el historial de la cuenta.
      p_permitir_quitar_movimiento: false,
    });

    setGuardando(false);
    if (error) {
      setResultado(error.message);
      return;
    }
    setValor("");
    setValorEditadoManualmente(false);
    setIncluyeMovimiento(false);
    setMovimientoMonto("");
    setResultado("ok");
  }

  if (cuentas.length === 0) return null;

  return (
    <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold">Carga rápida</p>
        <Ayuda>
          Registra el valor de hoy de una sola cuenta. Para actualizar varias cuentas a la vez, usa
          &quot;actualizar varias cuentas de una vez&quot; más abajo.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#A0A7B2] mb-4">Registra el valor de hoy de una cuenta</p>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-[#6B7280]">Cuenta</span>
        <select
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          className="h-10 px-3 rounded-[10px] border border-[#DFE2E8] text-[13px] bg-white focus:outline-none focus:border-[var(--accent)]"
        >
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} · {c.plataforma}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <span className="text-[11px] font-semibold text-[#6B7280]">Fecha</span>
          <p className="mt-1 h-10 px-3 rounded-[10px] bg-[#F7F8FA] flex items-center text-[13px] text-[#8A929E] font-mono-tabular">
            {formatoFecha(new Date().toISOString())}
          </p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#6B7280]">Valor actual</span>
          <InputMonto
            placeholder="0"
            className="h-10 px-3 rounded-[10px] border border-[#DFE2E8] text-right text-[13px] font-mono-tabular focus:outline-none focus:border-[var(--accent)]"
            value={valor}
            onChange={(v) => {
              setValor(v);
              setValorEditadoManualmente(true);
            }}
          />
        </label>
      </div>

      {cuenta && cuenta.moneda !== "CLP" && (
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-[#6B7280]">tasa de cambio</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              className="w-28 h-8 px-2 rounded-lg border border-[#DFE2E8] text-right text-[13px] font-mono-tabular focus:outline-none focus:border-[var(--accent)]"
              value={tasaCambio ?? ""}
              onChange={(e) => editarTasaManualmente(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          {cargandoTasa && (
            <span className="text-[11px] text-[#A0A7B2] text-right block">buscando tasa en mindicador.cl…</span>
          )}
          {!cargandoTasa && tasaFecha && (
            <span className="text-[11px] text-[#A0A7B2] text-right block">
              según Banco Central, {formatoFecha(tasaFecha)}
            </span>
          )}
          {errorTasa && (
            <span className="text-[11px] text-[var(--neg)] flex items-center justify-end gap-2">
              {errorTasa}
              <button
                type="button"
                onClick={() => cuenta && cargarTasa(cuenta)}
                className="underline shrink-0"
              >
                reintentar
              </button>
            </span>
          )}
        </div>
      )}

      {!incluyeMovimiento ? (
        <button
          type="button"
          onClick={() => cambiarMovimiento({ incluyeMovimiento: true })}
          className="mt-3 text-[11.5px] font-semibold text-[var(--accent)]"
        >
          + añadir aporte o retiro
        </button>
      ) : (
        <div className="mt-3 rounded-[10px] bg-[#F7F8FA] p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-[#6B7280]">esto incluye un aporte o retiro</span>
            <button
              type="button"
              onClick={() => cambiarMovimiento({ incluyeMovimiento: false })}
              className="text-[11px] text-[#98A0AB] border-b border-[#E2E5EA] shrink-0"
            >
              quitar
            </button>
          </div>
          {tieneMovimientoOriginal && (
            <span className="self-start text-[10px] font-medium text-[#8A929E] bg-white border border-[#E2E5EA] rounded px-1.5 py-px">
              ya registrado hoy
            </span>
          )}
          <div className="flex items-center gap-2">
            <select
              value={movimientoTipo}
              onChange={(e) => cambiarMovimiento({ movimientoTipo: e.target.value as TipoMovimiento })}
              className="h-9 px-2 rounded-lg border border-[#DFE2E8] text-[13px] bg-white shrink-0"
            >
              <option value="aporte">aporte</option>
              <option value="retiro">retiro</option>
            </select>
            <InputMonto
              placeholder="monto"
              className="flex-1 min-w-0 h-9 px-2.5 rounded-lg border border-[#DFE2E8] text-right text-[13px] font-mono-tabular bg-white focus:outline-none focus:border-[var(--accent)]"
              value={movimientoMonto}
              onChange={(m) => cambiarMovimiento({ movimientoMonto: m })}
            />
          </div>
        </div>
      )}

      <button
        onClick={guardar}
        disabled={guardando || cargandoTasa}
        className="w-full h-[42px] mt-4 rounded-[11px] bg-[var(--accent)] text-white text-[13.5px] font-semibold disabled:opacity-50 hover:brightness-[1.08]"
      >
        {guardando ? "Guardando…" : "Guardar registro"}
      </button>
      {resultado === "ok" && (
        <p className="mt-2.5 text-[12px] font-semibold text-center text-[var(--pos)]">✓ guardado</p>
      )}
      {resultado && resultado !== "ok" && (
        <p className="mt-2.5 text-[12px] font-semibold text-center text-[var(--neg)]">{resultado}</p>
      )}
    </section>
  );
}
