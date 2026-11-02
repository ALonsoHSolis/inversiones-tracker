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

// atajos como fila compacta de pildoras (antes: 4 tarjetas iguales de 84 px
// de alto, que alargaban el inicio y competian con las cifras). envuelven en
// pantallas angostas en vez de recortarse.
export function AccionesRapidas() {
  return (
    <nav aria-label="Acciones rápidas" className="no-print">
      <ul className="flex flex-wrap gap-2">
        {ACCIONES.map(({ href, etiqueta, Icono }, i) => (
          // en escritorio "Registrar valor" ya es el boton primario del header
          <li key={href} className={i === 0 ? "lg:hidden" : undefined}>
            <Link href={href} className={`${i === 0 ? "boton-primario" : "boton-secundario"} rounded-full no-underline`}>
              <Icono size={16} strokeWidth={2} aria-hidden="true" />
              {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
