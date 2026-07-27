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

export interface RachaResultado {
  tipo: "positiva" | "negativa" | null;
  longitud: number;
}

// racha de periodos consecutivos con el mismo signo de rendimiento, contando
// desde el mas reciente hacia atras (el arreglo debe venir ordenado por
// fecha descendente). un periodo con rendimiento_pct null (base <= 0, caso
// raro) corta la racha de inmediato -- no cuenta como positivo ni negativo.
export function calcularRacha(rendimientosOrdenadosDesc: (number | null)[]): RachaResultado {
  if (rendimientosOrdenadosDesc.length === 0 || rendimientosOrdenadosDesc[0] == null) {
    return { tipo: null, longitud: 0 };
  }
  const esPositiva = rendimientosOrdenadosDesc[0]! >= 0;
  let longitud = 0;
  for (const pct of rendimientosOrdenadosDesc) {
    if (pct == null || pct >= 0 !== esPositiva) break;
    longitud++;
  }
  return { tipo: esPositiva ? "positiva" : "negativa", longitud };
}

// retorno compuesto total (time-weighted return) de una serie de rendimientos
// por periodo, encadenando cada rendimiento_pct ya calculado por la vista sql
// (o su equivalente a nivel de portafolio, ver calcularRetornosPortafolio) --
// cada movimiento siempre viaja junto a un snapshot en la misma fecha
// (crear_cuenta_con_aporte_inicial / guardar_snapshot_con_movimiento lo
// garantizan), que es justo el requisito de un twr correcto. los periodos con
// rendimiento_pct null (base <= 0, caso raro) se omiten en vez de tratarse
// como 0% -- un retorno desconocido no es lo mismo que un retorno nulo.
export function calcularTWR(rendimientosPorPeriodo: (number | null)[]): number | null {
  const validos = rendimientosPorPeriodo.filter((r): r is number => r != null);
  if (validos.length === 0) return null;
  const factorTotal = validos.reduce((acc, pct) => acc * (1 + pct / 100), 1);
  return (factorTotal - 1) * 100;
}

// serie indexada (base 100) encadenando los mismos rendimientos por periodo
// que usa calcularTWR. al estar ya netos de aportes/retiros (rendimiento_pct
// resta aportes_netos antes de calcular el %), esta serie nunca confunde un
// retiro grande con una caida de mercado -- es la serie correcta sobre la
// que medir el maximo drawdown. medirlo sobre el valor bruto de la cuenta
// rompería la regla de negocio central del proyecto (un aporte/retiro no es
// rendimiento).
function calcularSerieIndexada(rendimientosPorPeriodo: (number | null)[]): number[] {
  const serie = [100];
  for (const pct of rendimientosPorPeriodo) {
    if (pct == null) continue;
    serie.push(serie[serie.length - 1] * (1 + pct / 100));
  }
  return serie;
}

// maximo drawdown (peor caida desde un maximo historico hasta el minimo
// posterior) sobre la serie indexada de rendimiento, nunca sobre el valor
// bruto (ver comentario de calcularSerieIndexada). devuelve un numero <= 0
// (ej. -18.4 = peor caida de 18.4%), o null si no hay al menos un periodo
// valido con el que construir la serie. subestima el drawdown real si el
// mercado cayo y se recupero entre dos actualizaciones del usuario --
// limitacion inherente a datos cargados manualmente, no del calculo en si.
export function calcularMaxDrawdown(rendimientosPorPeriodo: (number | null)[]): number | null {
  const serie = calcularSerieIndexada(rendimientosPorPeriodo);
  if (serie.length < 2) return null;

  let pico = serie[0];
  let peorCaida = 0;
  for (const valor of serie) {
    pico = Math.max(pico, valor);
    const caida = ((valor - pico) / pico) * 100;
    peorCaida = Math.min(peorCaida, caida);
  }
  return peorCaida;
}

export interface PuntoEvolucion {
  valorTotalClp: number;
  capitalAportadoAcumuladoClp: number;
}

// deriva el rendimiento por periodo del portafolio completo a partir de
// evolucion_portafolio (el arreglo debe venir ordenado por fecha
// ascendente), con la misma formula que ya usa rendimiento_semanal por
// cuenta: se resta el aporte neto del periodo (el delta de capital
// acumulado) antes de calcular el %, para que un aporte/retiro tampoco se
// confunda con ganancia a nivel de portafolio completo.
export function calcularRetornosPortafolio(puntos: PuntoEvolucion[]): (number | null)[] {
  const retornos: (number | null)[] = [];
  for (let i = 1; i < puntos.length; i++) {
    const anterior = puntos[i - 1];
    const actual = puntos[i];
    const aportesNetos = actual.capitalAportadoAcumuladoClp - anterior.capitalAportadoAcumuladoClp;
    const base = anterior.valorTotalClp + aportesNetos;
    const gananciaReal = actual.valorTotalClp - anterior.valorTotalClp - aportesNetos;
    retornos.push(base > 0 ? (gananciaReal / base) * 100 : null);
  }
  return retornos;
}

export interface FlujoCaja {
  fecha: string; // fecha iso (yyyy-mm-dd)
  // signo desde el punto de vista del inversionista: negativo = plata que
  // sale de tu bolsillo hacia la cuenta (aporte), positivo = plata que
  // vuelve (retiro, o el valor actual si "vendieras todo hoy").
  monto: number;
}

function valorPresenteNeto(flujos: FlujoCaja[], tasa: number, fechaBaseMs: number): number {
  return flujos.reduce((acc, f) => {
    const dias = (new Date(f.fecha).getTime() - fechaBaseMs) / (1000 * 60 * 60 * 24);
    return acc + f.monto / Math.pow(1 + tasa, dias / 365);
  }, 0);
}

// xirr: tasa de retorno anualizada que hace que el valor presente neto de
// una serie de flujos de caja con fechas irregulares sea cero -- a
// diferencia de calcularRendimientoAnualizado (cagr simple sobre capital
// aportado acumulado y valor actual, sin mirar el momento exacto de cada
// aporte dentro del periodo), xirr si ajusta por el momento exacto de cada
// flujo. Esta funcion es una metrica ADICIONAL: no reemplaza
// calcularRendimientoAnualizado en ningun lugar del código, por decisión
// explícita del usuario -- ese calculo simple sigue siendo el que se
// muestra como "rendimiento anualizado" en toda la app.
//
// se resuelve con biseccion (no newton-raphson): mas lento por iteracion,
// pero no requiere una derivada ni un punto de partida razonable, y con la
// cantidad de flujos de un uso personal (decenas, no miles) el costo es
// insignificante. requiere al menos un flujo negativo y uno positivo -- si
// todos los flujos tienen el mismo signo, no existe una tasa que resuelva
// vpn = 0 (ej. una cuenta que nunca recibio un aporte real).
export function calcularXIRR(flujos: FlujoCaja[]): number | null {
  if (flujos.length < 2) return null;
  const tieneNegativo = flujos.some((f) => f.monto < 0);
  const tienePositivo = flujos.some((f) => f.monto > 0);
  if (!tieneNegativo || !tienePositivo) return null;

  const fechaBaseMs = Math.min(...flujos.map((f) => new Date(f.fecha).getTime()));

  let bajo = -0.9999; // -99.99%, limite inferior (no se puede perder mas del 100%)
  let alto = 10; // +1000% anual, limite superior generoso
  let vpnBajo = valorPresenteNeto(flujos, bajo, fechaBaseMs);
  const vpnAlto = valorPresenteNeto(flujos, alto, fechaBaseMs);
  if (vpnBajo * vpnAlto > 0) return null; // no hay raiz dentro del rango (caso raro)

  for (let i = 0; i < 100; i++) {
    const medio = (bajo + alto) / 2;
    const vpnMedio = valorPresenteNeto(flujos, medio, fechaBaseMs);
    if (Math.abs(vpnMedio) < 1e-6) return medio * 100;
    if (vpnBajo * vpnMedio < 0) {
      alto = medio;
    } else {
      bajo = medio;
      vpnBajo = vpnMedio;
    }
  }
  return ((bajo + alto) / 2) * 100;
}
