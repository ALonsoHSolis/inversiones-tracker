import Link from "next/link";
import { FileText, Landmark, SquarePen, Target, type LucideIcon } from "lucide-react";

// atajos bajo el patrimonio (patron de las apps de billetera: cuatro acciones
// a un toque, icono en un cuadrado redondeado y la etiqueta debajo). son solo
// enlaces a pantallas que ya existen; no ejecutan nada por si mismos.
const ACCIONES: { href: string; etiqueta: string; Icono: LucideIcon }[] = [
  { href: "/registrar", etiqueta: "Registrar", Icono: SquarePen },
  { href: "/cuentas/nueva", etiqueta: "Nueva cuenta", Icono: Landmark },
  { href: "/metas/nueva", etiqueta: "Nueva meta", Icono: Target },
  { href: "/informe", etiqueta: "Informe", Icono: FileText },
];

export function AccionesRapidas() {
  return (
    <nav aria-label="Acciones rápidas" className="no-print">
      <ul className="grid grid-cols-4 gap-2">
        {ACCIONES.map(({ href, etiqueta, Icono }, i) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl px-1 text-center text-micro font-medium text-fg-soft no-underline transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-150 group-active:scale-95 ${
                  i === 0 ? "bg-accent text-on-accent" : "bg-surface text-accent-ink shadow-[0_0_0_1px_var(--color-edge-strong)]"
                }`}
              >
                <Icono size={20} strokeWidth={1.9} aria-hidden="true" />
              </span>
              {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
