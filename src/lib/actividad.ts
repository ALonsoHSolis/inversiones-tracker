// actividad reciente: ultimos aportes y retiros agrupados por dia. logica pura
// (sin react ni supabase) para poder testearla. es solo presentacion de datos
// que ya existen en `movimientos`: no calcula ganancias ni convierte monedas.
// los montos se muestran en la moneda nativa de la cuenta (regla 5 del
// proyecto) y NUNCA como ganancia: un aporte no es rendimiento.
import { fechaChileHaceDias } from "./fecha.ts";

export interface MovimientoActividad {
  cuenta_id: string | null;
  fecha: string;
  tipo: string;
  monto: number;
}

export interface CuentaActividad {
  id: string;
  nombre: string;
  moneda: string;
}

export interface ItemActividad {
  clave: string;
  cuentaId: string;
  cuentaNombre: string;
  moneda: string;
  tipo: "aporte" | "retiro";
  monto: number;
  fecha: string;
}

export type EtiquetaGrupo = "Hoy" | "Ayer" | "Anteriores";

export interface GrupoActividad {
  etiqueta: EtiquetaGrupo;
  items: ItemActividad[];
}

// `movimientos` puede venir en cualquier orden; las fechas son yyyy-mm-dd, asi
// que comparar strings equivale a comparar dias. a igual fecha, gana el que
// aparece despues en la entrada (la consulta ordena por fecha ascendente).
export function construirActividad({
  movimientos,
  cuentas,
  hoy,
  limite = 6,
  ahora = new Date(),
}: {
  movimientos: MovimientoActividad[];
  cuentas: CuentaActividad[];
  hoy: string;
  limite?: number;
  ahora?: Date;
}): GrupoActividad[] {
  const cuentaPorId = new Map(cuentas.map((c) => [c.id, c]));
  const items: ItemActividad[] = [];

  movimientos.forEach((m, i) => {
    if (!m.cuenta_id) return;
    if (m.tipo !== "aporte" && m.tipo !== "retiro") return;
    const cuenta = cuentaPorId.get(m.cuenta_id);
    if (!cuenta) return; // cuenta dada de baja: no se muestra
    items.push({
      clave: `${m.cuenta_id}-${m.fecha}-${m.tipo}-${i}`,
      cuentaId: cuenta.id,
      cuentaNombre: cuenta.nombre,
      moneda: cuenta.moneda,
      tipo: m.tipo,
      monto: m.monto,
      fecha: m.fecha,
    });
  });

  // ordena por fecha desc; el indice (embebido en la clave) desempata de forma
  // estable segun el orden de entrada invertido.
  const recientes = items
    .map((item, orden) => ({ item, orden }))
    .sort((a, b) => (a.item.fecha === b.item.fecha ? b.orden - a.orden : a.item.fecha < b.item.fecha ? 1 : -1))
    .slice(0, limite)
    .map((x) => x.item);

  // ayer en calendario de Chile, calculado desde el mismo "hoy" que usa la
  // pagina: si `hoy` no coincide con `ahora` (tests), se deriva de `hoy`.
  const ayer = ayerDe(hoy, ahora);
  const grupos: GrupoActividad[] = [];
  recientes.forEach((item) => {
    const etiqueta: EtiquetaGrupo = item.fecha === hoy ? "Hoy" : item.fecha === ayer ? "Ayer" : "Anteriores";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.etiqueta === etiqueta) ultimo.items.push(item);
    else grupos.push({ etiqueta, items: [item] });
  });
  return grupos;
}

function ayerDe(hoy: string, ahora: Date): string {
  // si `hoy` es el dia de `ahora` en Chile, usa el helper de fecha del proyecto
  if (fechaChileHaceDias(0, ahora) === hoy) return fechaChileHaceDias(1, ahora);
  const [y, m, d] = hoy.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}
