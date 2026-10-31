// logica de agrupacion y derivacion del dashboard, extraida de
// src/app/dashboard/page.tsx. son funciones puras (sin supabase ni react):
// el page consulta y esta logica transforma, y asi se puede probar con
// `npm test` sin levantar nada. SOLO imports de tipos (import type): node
// corre los tests sin resolver el alias "@/".
import type { Cuenta } from "../types/database";
import type { DatosComposicion, PuntoComposicion } from "../components/CompositionChart";

const MS_POR_DIA = 1000 * 60 * 60 * 24;

// forma minima de una fila de la vista capital_por_cuenta -- los campos son
// nullable porque el tipo generado de una vista marca todo asi.
export interface CapitalCuenta {
  capital_aportado_clp: number | null;
  valor_actual_clp: number | null;
  ultima_fecha?: string | null;
}

export interface GrupoCapital {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

// como se agrupa una cuenta: `clave` decide que cuentas caen juntas y `nombre`
// es lo que se muestra (se queda con el de la primera cuenta del grupo).
// devolver null deja la cuenta fuera (ej. cuentas sin categoria).
export type ClaveGrupo = (cuenta: Cuenta) => { clave: string; nombre: string } | null;

// plataforma es texto libre: se normaliza (trim + minusculas) para que un
// despiste de tipeo no genere dos grupos, pero se muestra el texto original.
export const porPlataforma: ClaveGrupo = (c) => ({
  clave: c.plataforma.trim().toLowerCase(),
  nombre: c.plataforma.trim(),
});

// tipo es un enum fijo: no hace falta normalizar, solo traducir a etiqueta.
export function porTipo(etiquetaPorTipo: Map<string, string>): ClaveGrupo {
  return (c) => ({ clave: c.tipo, nombre: etiquetaPorTipo.get(c.tipo) ?? c.tipo });
}

// categoria personalizada: texto libre y opcional; sin categoria no entra.
export const porCategoria: ClaveGrupo = (c) => {
  const cruda = c.categoria?.trim();
  return cruda ? { clave: cruda.toLowerCase(), nombre: cruda } : null;
};

// suma capital aportado y valor actual (ambos ya en CLP, convertidos por la
// vista con la tasa historica) por grupo, de mayor a menor valor actual.
export function agruparCapital(
  cuentas: Cuenta[],
  capital: Map<string, CapitalCuenta>,
  grupoDe: ClaveGrupo
): GrupoCapital[] {
  const grupos = new Map<string, GrupoCapital>();
  cuentas.forEach((cuenta) => {
    const g = grupoDe(cuenta);
    if (!g) return;
    const datos = capital.get(cuenta.id);
    const grupo = grupos.get(g.clave) ?? { nombre: g.nombre, capitalAportadoClp: 0, valorActualClp: 0 };
    grupo.capitalAportadoClp += datos?.capital_aportado_clp ?? 0;
    grupo.valorActualClp += datos?.valor_actual_clp ?? 0;
    grupos.set(g.clave, grupo);
  });
  return Array.from(grupos.values()).sort((a, b) => b.valorActualClp - a.valorActualClp);
}

// nombre de grupo de cada cuenta, con el mismo criterio de agruparCapital
// (primer nombre visto por clave). alimenta la composicion historica.
export function nombreGrupoPorCuenta(cuentas: Cuenta[], grupoDe: ClaveGrupo): Map<string, string> {
  const canonico = new Map<string, string>();
  const porCuenta = new Map<string, string>();
  cuentas.forEach((cuenta) => {
    const g = grupoDe(cuenta);
    if (!g) return;
    if (!canonico.has(g.clave)) canonico.set(g.clave, g.nombre);
    porCuenta.set(cuenta.id, canonico.get(g.clave)!);
  });
  return porCuenta;
}

// paleta ciclica del grafico de composicion: la cantidad de grupos es
// dinamica. sin verde ni rojo a proposito: esos colores significan
// ganancia/perdida.
export const PALETA_COMPOSICION = [
  "var(--color-accent)",
  "var(--color-slate)",
  "var(--color-copper)",
  "var(--color-mauve)",
  "var(--color-accent-hi)",
  "var(--color-steel)",
  "var(--color-clay)",
  "var(--color-stone)",
];

// pivotea valor_diario_por_cuenta (una fila por fecha+cuenta) agrupando por
// el nombre de grupo de cada cuenta. una fila de una cuenta que ya no esta
// activa cae en "otro" (igual que antes de la extraccion).
export function construirComposicion(
  filas: { fecha: string | null; cuenta_id: string | null; valor_clp: number | null }[],
  nombrePorCuenta: Map<string, string>
): DatosComposicion {
  const validas = filas.filter(
    (f): f is { fecha: string; cuenta_id: string; valor_clp: number } =>
      f.fecha !== null && f.cuenta_id !== null && f.valor_clp !== null
  );

  const totalPorGrupo = new Map<string, number>();
  validas.forEach((f) => {
    const nombre = nombrePorCuenta.get(f.cuenta_id) ?? "otro";
    totalPorGrupo.set(nombre, (totalPorGrupo.get(nombre) ?? 0) + f.valor_clp);
  });
  const nombresOrdenados = Array.from(totalPorGrupo.keys()).sort(
    (a, b) => (totalPorGrupo.get(b) ?? 0) - (totalPorGrupo.get(a) ?? 0)
  );
  const grupos = nombresOrdenados.map((nombre, i) => ({
    nombre,
    color: PALETA_COMPOSICION[i % PALETA_COMPOSICION.length],
  }));

  const porFecha = new Map<string, PuntoComposicion>();
  validas.forEach((f) => {
    const nombre = nombrePorCuenta.get(f.cuenta_id) ?? "otro";
    const punto = porFecha.get(f.fecha) ?? { fecha: f.fecha };
    punto[nombre] = (Number(punto[nombre]) || 0) + f.valor_clp;
    porFecha.set(f.fecha, punto);
  });

  const puntos = Array.from(porFecha.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  // cada punto necesita un valor explicito por grupo (no undefined) para que
  // el area apilada de recharts no deje huecos en fechas sin datos del grupo.
  puntos.forEach((p) => {
    grupos.forEach((g) => {
      if (!(g.nombre in p)) p[g.nombre] = 0;
    });
  });

  return { puntos, grupos };
}

// umbrales propios de la vista de salud de datos (no se comparten con los
// formularios a proposito -- misma convencion del proyecto).
export const UMBRAL_RENDIMIENTO_IMPLAUSIBLE_SALUD = 80;
export const UMBRAL_GAP_DIAS = 45;
export const UMBRAL_DATO_ANTIGUO_DIAS_SALUD = 14;

export interface AlertaSaludCuenta {
  cuentaId: string;
  nombre: string;
  diasSinActualizar: number | null;
  saltos: { fecha: string; pct: number }[];
  gaps: { diasGap: number; fechaFin: string }[];
}

export function calcularAlertasSalud(
  cuentas: Cuenta[],
  capital: Map<string, CapitalCuenta>,
  historialPorCuenta: Map<string, { fecha: string; rendimientoPct: number | null }[]>,
  ahoraMs: number
): AlertaSaludCuenta[] {
  return cuentas.map((cuenta) => {
    const historial = historialPorCuenta.get(cuenta.id) ?? [];

    const ultimaFecha = capital.get(cuenta.id)?.ultima_fecha;
    const diasCrudo = ultimaFecha ? (ahoraMs - new Date(ultimaFecha).getTime()) / MS_POR_DIA : null;
    const diasSinActualizar =
      diasCrudo != null && diasCrudo > UMBRAL_DATO_ANTIGUO_DIAS_SALUD ? diasCrudo : null;

    const saltos = historial
      .filter((h) => h.rendimientoPct != null && Math.abs(h.rendimientoPct) >= UMBRAL_RENDIMIENTO_IMPLAUSIBLE_SALUD)
      .map((h) => ({ fecha: h.fecha, pct: h.rendimientoPct! }));

    const gaps = historial.slice(1).flatMap((h, i) => {
      const diasGap = (new Date(h.fecha).getTime() - new Date(historial[i].fecha).getTime()) / MS_POR_DIA;
      return diasGap > UMBRAL_GAP_DIAS ? [{ diasGap, fechaFin: h.fecha }] : [];
    });

    return { cuentaId: cuenta.id, nombre: cuenta.nombre, diasSinActualizar, saltos, gaps };
  });
}

export interface MetaConProgresoDatos {
  id: string;
  nombre: string;
  montoObjetivo: number;
  montoActualClp: number;
  fechaObjetivo: string | null;
  cuentasAsociadas: string[];
}

// el progreso de cada meta suma valor_actual_clp de las cuentas asociadas via
// meta_cuentas. si una cuenta asociada se da de baja, capital_por_cuenta ya
// la excluye y simplemente deja de contar (mismo criterio que el dashboard).
export function calcularMetasConProgreso(
  metas: { id: string; nombre: string; monto_objetivo: number; fecha_objetivo: string | null }[],
  metaCuentas: { meta_id: string; cuenta_id: string }[],
  capital: Map<string, CapitalCuenta>,
  nombrePorCuentaId: Map<string, string>
): MetaConProgresoDatos[] {
  const cuentaIdsPorMeta = new Map<string, string[]>();
  metaCuentas.forEach((mc) => {
    const lista = cuentaIdsPorMeta.get(mc.meta_id) ?? [];
    lista.push(mc.cuenta_id);
    cuentaIdsPorMeta.set(mc.meta_id, lista);
  });
  return metas.map((meta) => {
    const cuentaIds = cuentaIdsPorMeta.get(meta.id) ?? [];
    return {
      id: meta.id,
      nombre: meta.nombre,
      montoObjetivo: meta.monto_objetivo,
      montoActualClp: cuentaIds.reduce((acc, id) => acc + (capital.get(id)?.valor_actual_clp ?? 0), 0),
      fechaObjetivo: meta.fecha_objetivo,
      cuentasAsociadas: cuentaIds.map((id) => nombrePorCuentaId.get(id)).filter((n): n is string => !!n),
    };
  });
}
