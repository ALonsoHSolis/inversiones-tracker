import { FileText, Landmark, SquarePen, Target, TrendingUp } from "lucide-react";
import { Monograma } from "@/components/Identidad";
import { formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import { ALTO, ANCHO, construirGeometria, type PuntoPatrimonio } from "@/lib/grafico-patrimonio";

// la app dentro de un celular, para la portada (como las landings de apps de
// inversion, que muestran su pantalla real y no una ilustracion abstracta).
// es una maqueta estatica del inicio con DATOS DE EJEMPLO, rotulada como tal:
// misma geometria del grafico (construirGeometria) y mismos componentes de
// identidad que la app, pero sin enlaces ni interaccion.
const CUENTAS = [
  { nombre: "Fondo conservador", plataforma: "Corredora A", valor: 4_820_000, pct: 0.4, color: "var(--color-slate)" },
  { nombre: "Acciones EE.UU.", plataforma: "Corredora B", valor: 3_640_000, pct: 1.7, color: "var(--color-copper)" },
  { nombre: "Depósito en UF", plataforma: "Banco C", valor: 2_760_000, pct: 0.1, color: "var(--color-mauve)" },
];

const ACCIONES = [
  { etiqueta: "Registrar", Icono: SquarePen },
  { etiqueta: "Cuenta", Icono: Landmark },
  { etiqueta: "Meta", Icono: Target },
  { etiqueta: "Informe", Icono: FileText },
];

export function TelefonoApp({ puntos, className = "" }: { puntos: PuntoPatrimonio[]; className?: string }) {
  const geo = construirGeometria(puntos);
  const ultimo = puntos[puntos.length - 1];
  const ganancia = ultimo.totalClp - ultimo.capitalClp;
  const gananciaPct = ultimo.capitalClp > 0 ? (ganancia / ultimo.capitalClp) * 100 : 0;

  return (
    <figure className={`telefono ${className}`}>
      <div className="telefono-pantalla tema-navy" aria-hidden="true">
        <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-semibold text-fg-soft">
          <span>9:41</span>
          <span className="telefono-isla" />
          <span className="tracking-[0.08em]">●●●</span>
        </div>

        <div className="px-5 pt-6">
          <p className="text-[12px] text-fg-muted">Patrimonio total</p>
          <p className="mt-1 font-mono-tabular text-[30px] font-normal leading-none tracking-[-0.03em] text-fg">
            <span className="mr-0.5 align-top text-[15px] text-fg-muted">$</span>
            {Math.round(ultimo.totalClp).toLocaleString("es-CL")}
          </p>
          <p className="mt-2 flex items-center gap-1 font-mono-tabular text-[12px] font-semibold text-pos">
            <TrendingUp size={13} strokeWidth={2.4} />
            {formatoPesosSigned(ganancia)} ({formatoPct(gananciaPct)})
            <span className="ml-1 font-sans font-normal text-fg-muted">ganancia real</span>
          </p>
        </div>

        {geo && (
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="mt-4 block h-[118px] w-full">
            <defs>
              <linearGradient id="telefono-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={geo.area} fill="url(#telefono-area)" />
            <path d={geo.capital} fill="none" stroke="rgba(214,220,230,0.45)" strokeWidth="1.2" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
            <path d={geo.linea} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}

        <div className="grid grid-cols-4 gap-1 px-4 pt-4">
          {ACCIONES.map(({ etiqueta, Icono }, i) => (
            <span key={etiqueta} className="flex flex-col items-center gap-1.5 text-[10.5px] text-fg-soft">
              <span
                className={`grid h-10 w-10 place-items-center rounded-[13px] ${
                  i === 0 ? "bg-accent text-on-accent" : "bg-tint/[0.07] text-accent-ink"
                }`}
              >
                <Icono size={17} strokeWidth={1.9} />
              </span>
              {etiqueta}
            </span>
          ))}
        </div>

        <div className="tema-claro mx-3 mt-5 rounded-[18px] px-3 py-1">
          {CUENTAS.map((c) => (
            <div key={c.nombre} className="relative flex items-center gap-2.5 border-b border-[var(--color-edge)] py-2.5 pl-2 last:border-0">
              <span className="absolute left-0 inset-y-3 w-[3px] rounded-full" style={{ background: c.color }} />
              <Monograma institucion={c.plataforma} tamano={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-fg">{c.nombre}</span>
                <span className="block text-[10.5px] text-fg-muted">{c.plataforma}</span>
              </span>
              <span className="text-right">
                <span className="block font-mono-tabular text-[12px] font-semibold text-fg">{formatoPesos(c.valor)}</span>
                <span className="block font-mono-tabular text-[10.5px] font-semibold text-pos">{formatoPct(c.pct)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">Pantalla de inicio de la app con datos de ejemplo.</figcaption>
    </figure>
  );
}
