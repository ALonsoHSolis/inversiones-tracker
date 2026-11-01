// reparto de un grupo de cuentas (por plataforma, tipo o categoria) para las
// tarjetas de distribucion. puro: solo convierte valores ya calculados
// (CLP, tasa historica) en participaciones y colores. no calcula rendimiento.
import { PALETA_COMPOSICION } from "./dashboard.ts";

export interface GrupoEntrada {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

export interface Participacion extends GrupoEntrada {
  porcentaje: number; // 0-100 sobre el total de valor actual
  color: string;
  gananciaClp: number;
  gananciaPct: number | null;
}

// a partir de este % del total se marca alta concentracion: solo informativo.
export const UMBRAL_CONCENTRACION = 40;

export function calcularParticipaciones(grupos: GrupoEntrada[]): Participacion[] {
  const total = grupos.reduce((acc, g) => acc + Math.max(g.valorActualClp, 0), 0);
  return grupos.map((g, i) => {
    const gananciaClp = g.valorActualClp - g.capitalAportadoClp;
    return {
      ...g,
      porcentaje: total > 0 ? (Math.max(g.valorActualClp, 0) / total) * 100 : 0,
      color: PALETA_COMPOSICION[i % PALETA_COMPOSICION.length],
      gananciaClp,
      gananciaPct: g.capitalAportadoClp > 0 ? (gananciaClp / g.capitalAportadoClp) * 100 : null,
    };
  });
}
