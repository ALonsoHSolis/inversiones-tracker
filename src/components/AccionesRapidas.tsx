import Link from "next/link";
import { FileText, Landmark, SquarePen, Target, type LucideIcon } from "lucide-react";

// fila de atajos bajo el resumen (patron de las apps de billetera: las
// acciones mas usadas a un toque). son solo enlaces a pantallas que ya
// existen; no ejecutan nada por si mismas.
const ACCIONES: { href: string; etiqueta: string; Icono: LucideIcon }[] = [
  { href: "/registrar", etiqueta: "Registrar valor", Icono: SquarePen },
  { href: "/cuentas/nueva", etiqueta: "Nueva cuenta", Icono: Landmark },
  { href: "/metas/nueva", etiqueta: "Nueva meta", Icono: Target },
  { href: "/informe", etiqueta: "Informe", Icono: FileText },
];

export function AccionesRapidas() {
  return (
    <nav aria-label="Acciones rápidas" className="no-print animate-fade-up" style={{ "--i": 1 } as React.CSSProperties}>
      <ul className="grid grid-cols-4 gap-2 sm:gap-3">
        {ACCIONES.map(({ href, etiqueta, Icono }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-surface px-1 py-3 text-center text-[12px] font-medium leading-tight text-fg-soft transition-[transform,border-color,background-color] duration-150 hover:border-accent/40 hover:bg-surface-raised active:scale-[0.97] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent/12 text-accent-hi transition-colors duration-150 group-hover:bg-accent group-hover:text-ink">
                <Icono size={18} strokeWidth={1.9} aria-hidden="true" />
              </span>
              {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
