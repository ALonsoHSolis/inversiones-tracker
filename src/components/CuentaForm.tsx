"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { InputMonto } from "@/components/InputMonto";
import { TIPOS } from "@/lib/tipos-cuenta";
import { formatoFecha } from "@/lib/formato";
import type { Moneda, TipoCuenta } from "@/types/database";

const MONEDAS: Moneda[] = ["CLP", "USD", "UF"];

const inputClass =
  "h-11 px-3 rounded-[10px] border border-white/[0.14] text-[14px] text-[#F2F5F9] bg-white/[0.04] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";
const labelClass = "text-[11px] font-semibold text-[#8892A0]";

// traduce errores tecnicos del rpc crear_cuenta_con_aporte_inicial (o de la
// conexion) a mensajes entendibles -- antes se mostraba error.message crudo
// (ej. mensajes de postgres sobre check constraints) directo al usuario.
function mensajeErrorAmigable(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("moneda")) return "la moneda seleccionada no es válida";
  if (m.includes("tipo") && m.includes("check")) return "el tipo de cuenta seleccionado no es válido";
  if (m.includes("monto_inicial") || (m.includes("monto") && m.includes("negativ"))) {
    return "el monto inicial no puede ser negativo";
  }
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) {
    return "no se pudo conectar — revisa tu conexión e intenta de nuevo";
  }
  return "no se pudo crear la cuenta. Intenta de nuevo o escríbenos si el problema persiste";
}

export function CuentaForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [tipo, setTipo] = useState<TipoCuenta>("otro");
  const [moneda, setMoneda] = useState<Moneda>("CLP");
  const [montoInicial, setMontoInicial] = useState("");

  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [tasaFecha, setTasaFecha] = useState<string | null>(null);
  const [cargandoTasa, setCargandoTasa] = useState(false);
  const [errorTasa, setErrorTasa] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  // un solo contador invalida tanto fetches viejos (cambio rapido de moneda)
  // como una respuesta que llegue tarde despues de que el usuario ya edito
  // el campo a mano — cualquiera de los dos casos avanza el contador y hace
  // que la respuesta en curso se descarte al llegar.
  const tasaRequestId = useRef(0);

  async function cargarTasa(m: Exclude<Moneda, "CLP">) {
    const requestId = ++tasaRequestId.current;
    setCargandoTasa(true);
    setErrorTasa(null);

    try {
      const { valor, fecha } = await obtenerTasaCambio(m);
      if (requestId !== tasaRequestId.current) return;
      setTasaCambio(valor);
      setTasaFecha(fecha);
    } catch (err) {
      if (requestId !== tasaRequestId.current) return;
      console.error(err);
      setTasaCambio(null);
      setTasaFecha(null);
      setErrorTasa("no se pudo obtener la tasa de cambio, revisa tu conexion e intenta de nuevo");
    } finally {
      if (requestId === tasaRequestId.current) setCargandoTasa(false);
    }
  }

  useEffect(() => {
    if (moneda === "CLP") {
      tasaRequestId.current++;
      setTasaCambio(null);
      setTasaFecha(null);
      setErrorTasa(null);
      setCargandoTasa(false);
      return;
    }

    cargarTasa(moneda);
  }, [moneda]);

  function editarTasaManualmente(valor: number | null) {
    tasaRequestId.current++; // invalida cualquier fetch en curso, no debe pisar esta edicion
    setCargandoTasa(false);
    setErrorTasa(null);
    setTasaCambio(valor);
  }

  async function guardarCuenta() {
    setErrorGuardado(null);

    if (moneda !== "CLP" && tasaCambio == null) {
      setErrorGuardado("todavia no hay una tasa de cambio para esta moneda");
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const { error } = await supabase.rpc("crear_cuenta_con_aporte_inicial", {
      p_nombre: nombre,
      p_plataforma: plataforma,
      p_tipo: tipo,
      p_moneda: moneda,
      p_monto_inicial: Number(montoInicial || 0),
      p_tasa_cambio: moneda === "CLP" ? undefined : (tasaCambio ?? undefined),
    });

    setGuardando(false);

    if (error) {
      console.error("crear_cuenta_con_aporte_inicial:", error.message);
      setErrorGuardado(mensajeErrorAmigable(error.message));
      return;
    }

    track("cuenta_creada", { moneda, tipo });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-[15px]">
        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>plataforma</span>
          <input
            type="text"
            required
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuenta)}
            className={inputClass}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>moneda</span>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
            className={inputClass}
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className={labelClass}>monto inicial</span>
          <InputMonto
            value={montoInicial}
            onChange={setMontoInicial}
            placeholder="0"
            className={`${inputClass} text-right font-mono-tabular`}
          />
        </label>

        {moneda !== "CLP" && (
          <label className="flex flex-col gap-[7px]">
            <span className={labelClass}>tasa de cambio</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={tasaCambio ?? ""}
              onChange={(e) =>
                editarTasaManualmente(e.target.value ? Number(e.target.value) : null)
              }
              className={`${inputClass} text-right font-mono-tabular`}
            />
            {cargandoTasa && (
              <span className="text-[11.5px] text-[#8892A0]">buscando tasa en mindicador.cl...</span>
            )}
            {!cargandoTasa && tasaFecha && (
              <span className="text-[11.5px] text-[#8892A0]">
                según Banco Central, {formatoFecha(tasaFecha)}
              </span>
            )}
            {errorTasa && (
              <span className="text-[11.5px] text-[var(--neg)] flex items-center gap-2">
                {errorTasa}
                <button
                  type="button"
                  onClick={() => cargarTasa(moneda as Exclude<Moneda, "CLP">)}
                  className="underline shrink-0"
                >
                  reintentar
                </button>
              </span>
            )}
          </label>
        )}

        {errorGuardado && <p className="text-[12.5px] text-[var(--neg)]">{errorGuardado}</p>}

        <button
          type="button"
          onClick={guardarCuenta}
          disabled={guardando || cargandoTasa}
          className="mt-2 h-11 w-full rounded-[10px] bg-[var(--accent)] text-[#0A0D13] text-[14px] font-semibold disabled:opacity-50"
        >
          {guardando ? "guardando..." : "crear cuenta"}
        </button>
      </div>
    </div>
  );
}
