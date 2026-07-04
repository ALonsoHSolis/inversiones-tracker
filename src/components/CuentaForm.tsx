"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { obtenerTasaCambio } from "@/lib/mindicador";
import { TIPOS } from "@/lib/tipos-cuenta";
import type { Moneda, TipoCuenta } from "@/types/database";

const MONEDAS: Moneda[] = ["CLP", "USD", "UF"];

function formatoFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setErrorGuardado(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">nombre</span>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">plataforma</span>
          <input
            type="text"
            required
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuenta)}
            className="rounded border border-gray-300 px-3 py-2 bg-white"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">moneda</span>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
            className="rounded border border-gray-300 px-3 py-2 bg-white"
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">monto inicial</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            required
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {moneda !== "CLP" && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">tasa de cambio</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={tasaCambio ?? ""}
              onChange={(e) =>
                editarTasaManualmente(e.target.value ? Number(e.target.value) : null)
              }
              className="rounded border border-gray-300 px-3 py-2"
            />
            {cargandoTasa && <span className="text-xs text-gray-500">buscando tasa en mindicador.cl...</span>}
            {!cargandoTasa && tasaFecha && (
              <span className="text-xs text-gray-500">
                segun Banco Central, {formatoFecha(tasaFecha)}
              </span>
            )}
            {errorTasa && (
              <span className="text-xs text-red-700 flex items-center gap-2">
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

        {errorGuardado && <p className="text-xs text-red-700">{errorGuardado}</p>}

        <button
          type="button"
          onClick={guardarCuenta}
          disabled={guardando || cargandoTasa}
          className="mt-2 w-full rounded bg-gray-900 text-white text-sm py-2 disabled:opacity-50"
        >
          {guardando ? "guardando..." : "crear cuenta"}
        </button>
      </div>
    </div>
  );
}
