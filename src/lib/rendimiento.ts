import type { TipoMovimiento } from "@/types/database";

export interface MovimientoSimple {
  tipo: TipoMovimiento;
  monto: number;
}

export interface ResultadoRendimiento {
  gananciaReal: number;
  aportesNetos: number;
  rendimientoPct: number | null;
}

// espejo en typescript de la logica de la vista rendimiento_semanal en schema.sql.
// util para calculos en el cliente (ej. previsualizar antes de guardar un snapshot).
// la fuente de verdad para el dashboard es la vista sql, no esta funcion.
export function calcularRendimiento(
  valorInicial: number,
  valorFinal: number,
  movimientos: MovimientoSimple[]
): ResultadoRendimiento {
  const aportesNetos = movimientos.reduce((acc, m) => {
    return acc + (m.tipo === "aporte" ? m.monto : -m.monto);
  }, 0);

  const gananciaReal = valorFinal - valorInicial - aportesNetos;
  const base = valorInicial + aportesNetos;
  const rendimientoPct = base > 0 ? (gananciaReal / base) * 100 : null;

  return { gananciaReal, aportesNetos, rendimientoPct };
}

// dias minimos desde la creacion de la cuenta antes de mostrar un rendimiento
// anualizado: con pocos dias de historial, elevar el retorno a 365/dias lo
// dispara a numeros absurdos (ej. +2% en 5 dias -> cientos de % anualizado).
const DIAS_MINIMOS_ANUALIZADO = 30;

// aproxima el rendimiento anualizado (cagr) de una cuenta usando su capital
// aportado y valor actual acumulados desde que se creo (capital_por_cuenta),
// sin ajustar por el momento exacto de cada aporte dentro del periodo -- ese
// ajuste (metodo dietz modificado) esta fuera de alcance para esta version
// (ver CLAUDE.md), la formula simple ya definida es suficiente.
export function calcularRendimientoAnualizado(
  capitalAportado: number,
  valorActual: number,
  diasTranscurridos: number
): number | null {
  if (capitalAportado <= 0 || diasTranscurridos < DIAS_MINIMOS_ANUALIZADO) return null;

  const retornoTotal = (valorActual - capitalAportado) / capitalAportado;
  const base = 1 + retornoTotal;
  if (base < 0) return null;

  return (Math.pow(base, 365 / diasTranscurridos) - 1) * 100;
}

// separa el "% real" de una cuenta no-clp en el desempeño del activo (ya es
// rendimiento_pct, sin ruido cambiario por regla de negocio) y el efecto
// puro del movimiento del tipo de cambio entre el snapshot actual y el
// anterior. null cuando no hay tasa anterior con la que comparar (cuenta
// con un solo snapshot) -- evita mostrar un % calculado sobre una base
// inexistente o cero.
export function calcularEfectoTipoCambio(
  tasaCambio: number | null,
  tasaCambioAnterior: number | null
): number | null {
  if (tasaCambio == null || tasaCambioAnterior == null || tasaCambioAnterior <= 0) return null;
  return ((tasaCambio - tasaCambioAnterior) / tasaCambioAnterior) * 100;
}
