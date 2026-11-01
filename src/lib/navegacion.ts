// mapa de navegacion de la parte autenticada. logica pura (sin react) para
// poder testearla: que seccion esta activa, el titulo de la barra superior y
// a donde vuelve una subpagina.

export type SeccionId = "resumen" | "cuentas" | "registrar" | "analisis" | "metas" | "informes" | "configuracion";

export interface Seccion {
  id: SeccionId;
  href: string;
  etiqueta: string;
}

// orden del sidebar de escritorio.
export const SECCIONES: Seccion[] = [
  { id: "resumen", href: "/dashboard", etiqueta: "Resumen" },
  { id: "cuentas", href: "/cuentas", etiqueta: "Cuentas" },
  { id: "registrar", href: "/registrar", etiqueta: "Registro" },
  { id: "analisis", href: "/analisis", etiqueta: "Análisis" },
  { id: "metas", href: "/metas", etiqueta: "Metas" },
  { id: "informes", href: "/informe", etiqueta: "Informes" },
  { id: "configuracion", href: "/perfil", etiqueta: "Configuración" },
];

// secciones que viven en la barra inferior del celular; el resto va en "Más".
export const SECCIONES_MOVIL: SeccionId[] = ["resumen", "cuentas", "registrar", "analisis"];
export const SECCIONES_MAS: SeccionId[] = ["metas", "informes", "configuracion"];

function empiezaCon(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function seccionActiva(pathname: string): SeccionId | null {
  const encontrada = SECCIONES.find((s) => empiezaCon(pathname, s.href));
  return encontrada?.id ?? null;
}

export function tituloDe(pathname: string): string {
  if (pathname === "/cuentas/nueva") return "Agregar cuenta";
  if (pathname === "/cuentas/inactivas") return "Cuentas inactivas";
  if (/^\/cuentas\/[^/]+\/editar$/.test(pathname)) return "Editar cuenta";
  if (/^\/cuentas\/[^/]+\/historial$/.test(pathname)) return "Historial de la cuenta";
  if (pathname === "/metas/nueva") return "Nueva meta";
  const id = seccionActiva(pathname);
  return SECCIONES.find((s) => s.id === id)?.etiqueta ?? "Mi portafolio";
}

// a donde lleva el "volver" de una subpagina; null si es una pagina raiz.
export function padreDe(pathname: string): { href: string; etiqueta: string } | null {
  if (pathname === "/cuentas/nueva" || pathname === "/cuentas/inactivas") {
    return { href: "/cuentas", etiqueta: "Cuentas" };
  }
  if (/^\/cuentas\/[^/]+\/(editar|historial)$/.test(pathname)) return { href: "/cuentas", etiqueta: "Cuentas" };
  if (pathname === "/metas/nueva") return { href: "/metas", etiqueta: "Metas" };
  return null;
}
