"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChartLine,
  Ellipsis,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  SquarePen,
  Target,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { LogoMark } from "@/components/Logo";
import { MenuCuenta } from "@/components/MenuCuenta";
import { PrivacyToggleButton } from "@/components/PrivacyShell";
import {
  padreDe,
  seccionActiva,
  SECCIONES,
  SECCIONES_MAS,
  SECCIONES_MOVIL,
  tituloDe,
  type Seccion,
  type SeccionId,
} from "@/lib/navegacion";

const ICONOS: Record<SeccionId, LucideIcon> = {
  resumen: LayoutDashboard,
  cuentas: Wallet,
  registrar: SquarePen,
  analisis: ChartLine,
  metas: Target,
  informes: FileText,
  configuracion: Settings,
};

// etiqueta mas corta para la barra inferior (320 px de ancho: 5 items)
const ETIQUETA_MOVIL: Partial<Record<SeccionId, string>> = { resumen: "Inicio", registrar: "Registrar" };

const seccionPorId = new Map(SECCIONES.map((s) => [s.id, s]));
function secciones(ids: SeccionId[]): Seccion[] {
  return ids.map((id) => seccionPorId.get(id)).filter((s): s is Seccion => !!s);
}

// --- estado del sidebar (colapsado) persistido en localStorage -------------
const CLAVE_SIDEBAR = "sidebar:colapsado";
const EVENTO_SIDEBAR = "sidebar:cambio";

function suscribirSidebar(avisar: () => void) {
  window.addEventListener("storage", avisar);
  window.addEventListener(EVENTO_SIDEBAR, avisar);
  return () => {
    window.removeEventListener("storage", avisar);
    window.removeEventListener(EVENTO_SIDEBAR, avisar);
  };
}
function leerSidebar(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_SIDEBAR) === "1";
  } catch {
    return false;
  }
}
function guardarSidebar(colapsado: boolean) {
  try {
    window.localStorage.setItem(CLAVE_SIDEBAR, colapsado ? "1" : "0");
  } catch {
    // sin storage (modo privado): el estado simplemente no persiste
  }
  window.dispatchEvent(new Event(EVENTO_SIDEBAR));
}

const FOCO = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface AppShellProps {
  email: string;
  // acciones ocasionales ya renderizadas en el servidor (exportar, imprimir,
  // soporte, cerrar sesion): se muestran en el menu de cuenta (escritorio) y
  // en la hoja "Más" (celular).
  acciones: ReactNode;
  children: ReactNode;
}

export function AppShell({ email, acciones, children }: AppShellProps) {
  const pathname = usePathname();
  const activa = seccionActiva(pathname);
  const padre = padreDe(pathname);
  const titulo = tituloDe(pathname);
  const colapsado = useSyncExternalStore(suscribirSidebar, leerSidebar, () => false);
  const [masAbierto, setMasAbierto] = useState(false);

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-ink"
      >
        Saltar al contenido
      </a>

      {/* sidebar de escritorio */}
      <aside
        aria-label="Navegación principal"
        className={`no-print hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-[var(--color-edge)] bg-[#0a101b] transition-[width] duration-200 ease-out motion-reduce:transition-none ${
          colapsado ? "w-[72px]" : "w-[248px]"
        }`}
      >
        <div className={`flex items-center h-16 shrink-0 ${colapsado ? "justify-center" : "px-5 gap-3"}`}>
          <Link href="/dashboard" aria-label="Mi portafolio, ir al resumen" className={`rounded-xl ${FOCO}`}>
            <LogoMark size={36} />
          </Link>
          {!colapsado && <span className="text-[15px] font-semibold tracking-[-0.01em] text-fg">Mi portafolio</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-1">
            {SECCIONES.map((s) => {
              const Icono = ICONOS[s.id];
              const esActiva = s.id === activa;
              return (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    aria-current={esActiva ? "page" : undefined}
                    title={colapsado ? s.etiqueta : undefined}
                    className={`group flex items-center h-11 rounded-xl text-small font-medium transition-colors duration-150 ${FOCO} ${
                      colapsado ? "justify-center" : "gap-3 px-3"
                    } ${
                      esActiva
                        ? "bg-white/[0.06] text-fg"
                        : "text-fg-muted hover:bg-white/[0.04] hover:text-fg"
                    }`}
                  >
                    <Icono size={18} strokeWidth={esActiva ? 2.1 : 1.8} aria-hidden="true" className={`shrink-0 ${esActiva ? "text-accent" : ""}`} />
                    {colapsado ? <span className="sr-only">{s.etiqueta}</span> : s.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-[var(--color-edge)] p-3">
          <button
            type="button"
            onClick={() => guardarSidebar(!colapsado)}
            aria-pressed={colapsado}
            aria-label={colapsado ? "Expandir la barra lateral" : "Contraer la barra lateral"}
            title={colapsado ? "Expandir" : "Contraer"}
            className={`flex items-center h-10 w-full rounded-xl text-small text-fg-muted transition-colors duration-150 hover:bg-white/[0.05] hover:text-fg ${FOCO} ${
              colapsado ? "justify-center" : "gap-3 px-3"
            }`}
          >
            {colapsado ? (
              <PanelLeftOpen size={18} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose size={18} strokeWidth={1.8} aria-hidden="true" />
                Contraer
              </>
            )}
          </button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ease-out motion-reduce:transition-none print:pl-0 ${colapsado ? "lg:pl-[72px]" : "lg:pl-[248px]"}`}>
        {/* barra superior */}
        <header className="no-print sticky top-0 z-20 border-b border-[var(--color-edge)] bg-ink/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-14 lg:h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            {padre ? (
              <Link
                href={padre.href}
                aria-label={`Volver a ${padre.etiqueta}`}
                className={`inline-flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-fg-soft hover:bg-white/[0.06] lg:hidden ${FOCO}`}
              >
                <ArrowLeft size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/dashboard" aria-label="Mi portafolio, ir al resumen" className={`lg:hidden rounded-xl ${FOCO}`}>
                <LogoMark size={32} />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              {padre && (
                <Link
                  href={padre.href}
                  className={`hidden lg:inline-flex items-center gap-1 text-micro text-fg-muted hover:text-fg rounded ${FOCO}`}
                >
                  <ArrowLeft size={12} aria-hidden="true" />
                  {padre.etiqueta}
                </Link>
              )}
              <p className="truncate text-base lg:text-[17px] font-semibold tracking-[-0.01em] text-fg">{titulo}</p>
            </div>

            {activa !== "registrar" && (
              <Link href="/registrar" className="boton-primario hidden lg:inline-flex no-underline">
                <SquarePen size={16} strokeWidth={2} aria-hidden="true" />
                Registrar valor
              </Link>
            )}
            <PrivacyToggleButton compact />
            <div className="hidden lg:block">
              <MenuCuenta email={email}>{acciones}</MenuCuenta>
            </div>
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-16 outline-none print:max-w-none print:p-0"
        >
          {children}
        </main>
      </div>

      {/* navegacion inferior en celular: pildora flotante (patron de apps de
          billetera). el item activo lleva un circulo champan; todos conservan
          su etiqueta visible. */}
      <nav
        aria-label="Navegación principal"
        className="no-print lg:hidden fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pointer-events-none"
      >
        <ul className="pointer-events-auto mx-auto grid max-w-[480px] grid-cols-5 rounded-full border border-white/[0.1] bg-surface-raised/92 px-1.5 py-1.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)] backdrop-blur-xl">
          {secciones(SECCIONES_MOVIL).map((s) => {
            const Icono = ICONOS[s.id];
            const esActiva = s.id === activa;
            return (
              <li key={s.id}>
                <Link
                  href={s.href}
                  aria-current={esActiva ? "page" : undefined}
                  className={`flex h-[60px] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none ${FOCO} ${
                    esActiva ? "text-fg" : "text-fg-muted active:text-fg"
                  }`}
                >
                  <span
                    className={`grid h-8 w-11 place-items-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                      esActiva ? "bg-accent text-ink" : ""
                    }`}
                  >
                    <Icono size={19} strokeWidth={esActiva ? 2.1 : 1.8} aria-hidden="true" />
                  </span>
                  {ETIQUETA_MOVIL[s.id] ?? s.etiqueta}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMasAbierto(true)}
              aria-haspopup="dialog"
              aria-expanded={masAbierto}
              className={`flex h-[60px] w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none ${FOCO} ${
                SECCIONES_MAS.includes(activa as SeccionId) ? "text-fg" : "text-fg-muted active:text-fg"
              }`}
            >
              <span
                className={`grid h-8 w-11 place-items-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                  SECCIONES_MAS.includes(activa as SeccionId) ? "bg-accent text-ink" : ""
                }`}
              >
                <Ellipsis size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>

      <HojaMas abierta={masAbierto} alCerrar={() => setMasAbierto(false)} email={email} activa={activa}>
        {acciones}
      </HojaMas>
    </div>
  );
}

// hoja inferior "Más". usa <dialog> nativo: trampa de foco, Escape y
// aislamiento del resto de la pagina vienen del navegador.
function HojaMas({
  abierta,
  alCerrar,
  email,
  activa,
  children,
}: {
  abierta: boolean;
  alCerrar: () => void;
  email: string;
  activa: SeccionId | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierta && !dialogo.open) dialogo.showModal();
    if (!abierta && dialogo.open) dialogo.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      aria-label="Más opciones"
      onClose={alCerrar}
      onClick={(e) => {
        // click en el fondo (el propio <dialog>) o en un enlace: cierra
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) alCerrar();
      }}
      className="no-print fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-3xl border border-b-0 border-[var(--line)] bg-surface p-0 text-fg backdrop:bg-black/60 lg:hidden"
    >
      <div className="mx-auto max-w-[560px] px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-fg">Más</p>
            <p className="truncate text-micro text-fg-muted">{email}</p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-fg-soft hover:bg-white/[0.06] ${FOCO}`}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <ul className="flex flex-col">
          {secciones(SECCIONES_MAS).map((s) => {
            const Icono = ICONOS[s.id];
            const esActiva = s.id === activa;
            return (
              <li key={s.id}>
                <Link
                  href={s.href}
                  aria-current={esActiva ? "page" : undefined}
                  className={`flex h-12 items-center gap-3 rounded-xl px-3 text-small font-medium ${FOCO} ${
                    esActiva ? "bg-accent/12 text-accent-hi" : "text-fg-soft hover:bg-white/[0.05]"
                  }`}
                >
                  <Icono size={18} strokeWidth={1.8} aria-hidden="true" />
                  {s.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 border-t border-[var(--line)] pt-2 [&_a]:min-h-11 [&_a]:flex [&_a]:items-center [&_a]:text-[15px] [&_button]:min-h-11 [&_button]:text-[15px]">
          {children}
        </div>
      </div>
    </dialog>
  );
}
