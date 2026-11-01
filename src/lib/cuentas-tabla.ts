// filtrado, orden y agrupacion de la tabla de cuentas. funciones puras (sin
// react ni supabase) para probarlas con `npm test`. NO calculan rendimiento:
// reciben las cifras ya derivadas en el servidor (misma fuente que AccountRow)
// y solo las muestran en otro orden.

export interface FilaCuenta {
  id: string;
  nombre: string;
  plataforma: string;
  tipo: string;
  tipoLabel: string;
  moneda: string;
  // valor actual en CLP (columnas *_clp de las vistas, tasa historica)
  valorClp: number | null;
  // rendimiento real de la ultima semana, en moneda NATIVA (regla de negocio 5)
  rendimientoPct: number | null;
  // rendimiento anualizado simple (moneda nativa)
  anualizadoPct: number | null;
  // aportes netos del ultimo periodo, en moneda nativa; 0 / null si no hubo
  aporteNeto: number | null;
  ultimaFecha: string | null;
  diasSinActualizar: number | null;
  datoAntiguo: boolean;
}

export type ClaveOrden = "nombre" | "plataforma" | "valor" | "rendimiento" | "actualizacion";
export type Direccion = "asc" | "desc";

export interface Filtros {
  texto: string;
  tipo: string; // "todos" o un valor de tipo
  plataforma: string; // "todas" o la clave normalizada de la plataforma
  moneda: string; // "todas" o CLP / USD / UF
}

export const FILTROS_VACIOS: Filtros = { texto: "", tipo: "todos", plataforma: "todas", moneda: "todas" };

// minusculas y sin tildes: "Depósito" debe calzar con "deposito".
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function clavePlataforma(plataforma: string): string {
  return plataforma.trim().toLowerCase();
}

export function hayFiltrosActivos(f: Filtros): boolean {
  return f.texto.trim() !== "" || f.tipo !== "todos" || f.plataforma !== "todas" || f.moneda !== "todas";
}

export function filtrarCuentas(filas: FilaCuenta[], f: Filtros): FilaCuenta[] {
  const q = normalizar(f.texto);
  return filas.filter((c) => {
    if (f.tipo !== "todos" && c.tipo !== f.tipo) return false;
    if (f.plataforma !== "todas" && clavePlataforma(c.plataforma) !== f.plataforma) return false;
    if (f.moneda !== "todas" && c.moneda !== f.moneda) return false;
    if (q === "") return true;
    return normalizar(`${c.nombre} ${c.plataforma} ${c.tipoLabel}`).includes(q);
  });
}

function valorOrden(c: FilaCuenta, clave: ClaveOrden): number | string | null {
  switch (clave) {
    case "nombre":
      return normalizar(c.nombre);
    case "plataforma":
      return normalizar(c.plataforma);
    case "valor":
      return c.valorClp;
    case "rendimiento":
      return c.rendimientoPct;
    case "actualizacion":
      return c.ultimaFecha; // yyyy-mm-dd: el orden de texto es el cronologico
  }
}

// los valores faltantes van SIEMPRE al final, sin importar la direccion: una
// cuenta sin dato no es "la peor" ni "la mejor". desempata por nombre para que
// el orden sea estable.
export function ordenarCuentas(filas: FilaCuenta[], clave: ClaveOrden, direccion: Direccion): FilaCuenta[] {
  const signo = direccion === "asc" ? 1 : -1;
  return [...filas].sort((a, b) => {
    const va = valorOrden(a, clave);
    const vb = valorOrden(b, clave);
    if (va == null && vb == null) return normalizar(a.nombre).localeCompare(normalizar(b.nombre), "es");
    if (va == null) return 1;
    if (vb == null) return -1;
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
    if (cmp !== 0) return cmp * signo;
    return normalizar(a.nombre).localeCompare(normalizar(b.nombre), "es");
  });
}

export interface GrupoPlataforma {
  clave: string;
  plataforma: string;
  filas: FilaCuenta[];
  totalClp: number;
}

// agrupa por plataforma (misma normalizacion que el dashboard) conservando el
// orden de las filas; los grupos, de mayor a menor valor.
export function agruparPorPlataforma(filas: FilaCuenta[]): GrupoPlataforma[] {
  const grupos = new Map<string, GrupoPlataforma>();
  filas.forEach((c) => {
    const clave = clavePlataforma(c.plataforma);
    const g = grupos.get(clave) ?? { clave, plataforma: c.plataforma.trim(), filas: [], totalClp: 0 };
    g.filas.push(c);
    g.totalClp += c.valorClp ?? 0;
    grupos.set(clave, g);
  });
  return Array.from(grupos.values()).sort((a, b) => b.totalClp - a.totalClp);
}

export function totalClp(filas: FilaCuenta[]): number {
  return filas.reduce((acc, c) => acc + (c.valorClp ?? 0), 0);
}

// opciones unicas para los selects de filtro.
export function opcionesPlataforma(filas: FilaCuenta[]): { clave: string; nombre: string }[] {
  const m = new Map<string, string>();
  filas.forEach((c) => {
    const k = clavePlataforma(c.plataforma);
    if (!m.has(k)) m.set(k, c.plataforma.trim());
  });
  return Array.from(m, ([clave, nombre]) => ({ clave, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
