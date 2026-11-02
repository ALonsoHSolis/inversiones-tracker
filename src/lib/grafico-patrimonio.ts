// geometria del grafico del patrimonio (hero del inicio). funciones puras,
// probadas con `npm test`. solo presentacion: los valores vienen tal cual de
// la vista evolucion_portafolio (ya en CLP con la tasa historica de cada
// registro); aca no se calcula ningun rendimiento.
//
// decisiones:
//  - el eje X es proporcional a la FECHA (no al indice): dos registros
//    separados por dos meses quedan lejos, como en el tiempo real.
//  - la linea del patrimonio une registros reales con rectas (sin curvas que
//    puedan inventar picos); el capital aportado va en escalones, porque un
//    aporte es un salto real, no una rampa.
//  - el eje Y se ajusta al rango de los datos (ya no hay areas apiladas desde
//    $0 que obliguen a partir de cero), con un margen para que la linea no
//    toque los bordes.

export interface PuntoPatrimonio {
  fecha: string;
  totalClp: number;
  capitalClp: number;
}

export const PERIODOS = ["1M", "3M", "6M", "1A", "Máx"] as const;
export type Periodo = (typeof PERIODOS)[number];
const DIAS: Record<Exclude<Periodo, "Máx">, number> = { "1M": 30, "3M": 90, "6M": 182, "1A": 365 };

// si el periodo deja menos de 2 puntos se muestra todo el historial y se avisa
export function filtrarPeriodo(puntos: PuntoPatrimonio[], periodo: Periodo) {
  if (periodo === "Máx" || puntos.length === 0) return { puntos, insuficiente: false };
  const ultima = new Date(puntos[puntos.length - 1].fecha).getTime();
  const desde = ultima - DIAS[periodo] * 86_400_000;
  const filtrados = puntos.filter((p) => new Date(p.fecha).getTime() >= desde);
  return filtrados.length >= 2 ? { puntos: filtrados, insuficiente: false } : { puntos, insuficiente: true };
}

export interface Geometria {
  // posiciones en un lienzo de 0..ANCHO x 0..ALTO (viewBox del svg)
  xs: number[];
  ysTotal: number[];
  ysCapital: number[];
  linea: string;
  area: string;
  capital: string;
}

export const ANCHO = 1000;
export const ALTO = 300;

export function construirGeometria(puntos: PuntoPatrimonio[], margen = 0.12): Geometria | null {
  if (puntos.length < 2) return null;
  const t0 = new Date(puntos[0].fecha).getTime();
  const t1 = new Date(puntos[puntos.length - 1].fecha).getTime();
  const rangoT = Math.max(t1 - t0, 1);
  const valores = puntos.flatMap((p) => [p.totalClp, p.capitalClp]);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const pad = (max - min) * margen;
  min -= pad;
  max += pad;
  const y = (v: number) => ALTO - ((v - min) / (max - min)) * ALTO;

  const xs = puntos.map((p) => ((new Date(p.fecha).getTime() - t0) / rangoT) * ANCHO);
  const ysTotal = puntos.map((p) => y(p.totalClp));
  const ysCapital = puntos.map((p) => y(p.capitalClp));
  const r = (n: number) => Math.round(n * 10) / 10;

  const linea = xs.map((x, i) => `${i === 0 ? "M" : "L"}${r(x)} ${r(ysTotal[i])}`).join(" ");
  const area = `${linea} L${r(xs[xs.length - 1])} ${ALTO} L${r(xs[0])} ${ALTO} Z`;
  const capital = xs
    .map((x, i) => (i === 0 ? `M${r(x)} ${r(ysCapital[0])}` : `L${r(x)} ${r(ysCapital[i - 1])} L${r(x)} ${r(ysCapital[i])}`))
    .join(" ");
  return { xs, ysTotal, ysCapital, linea, area, capital };
}

// indice del punto mas cercano a una posicion horizontal (0..1 del ancho)
export function indiceMasCercano(xs: number[], fraccion: number): number {
  const objetivo = Math.min(Math.max(fraccion, 0), 1) * ANCHO;
  let mejor = 0;
  for (let i = 1; i < xs.length; i++) {
    if (Math.abs(xs[i] - objetivo) < Math.abs(xs[mejor] - objetivo)) mejor = i;
  }
  return mejor;
}
