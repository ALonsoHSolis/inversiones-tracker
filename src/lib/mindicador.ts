import type { Moneda } from "@/types/database";

const CODIGO_MINDICADOR: Record<Exclude<Moneda, "CLP">, string> = {
  USD: "dolar",
  UF: "uf",
};

export interface TasaCambio {
  valor: number;
  fecha: string;
}

// usa el endpoint general (sin fecha) en vez de pedir la fecha de hoy: la api
// devuelve serie[] vacio en fines de semana/feriados para fechas especificas,
// mientras que el endpoint general siempre trae el dato disponible mas
// reciente como serie[0], lo que resuelve el fallback gratis.
// sin timeout, un mindicador.cl colgado deja cargandoTasa en true para
// siempre -- y el boton "guardar" de SnapshotForm/CargaRapida/CuentaForm se
// deshabilita mientras cargandoTasa es true, asi que quedaria imposible
// guardar esa cuenta hasta que el fetch resuelva (el boton "reintentar" solo
// aparece tras un error, nunca mientras esta pendiente).
const TIMEOUT_MS = 5000;

export async function obtenerTasaCambio(moneda: Exclude<Moneda, "CLP">): Promise<TasaCambio> {
  const codigo = CODIGO_MINDICADOR[moneda];
  const res = await fetch(`https://mindicador.cl/api/${codigo}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  if (!res.ok) {
    throw new Error(`mindicador.cl respondio ${res.status}`);
  }

  const data = await res.json();
  const ultimo = data?.serie?.[0];

  if (!ultimo || typeof ultimo.valor !== "number") {
    throw new Error(`mindicador.cl no tiene datos disponibles para ${moneda}`);
  }

  return { valor: ultimo.valor, fecha: ultimo.fecha };
}
