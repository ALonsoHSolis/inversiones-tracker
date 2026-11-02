import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatoFecha, formatoMontoNativo } from "@/lib/formato";
import type { GrupoActividad } from "@/lib/actividad";

// ultimos aportes y retiros, agrupados por dia. decisiones:
//  - un aporte NUNCA va en verde ni con "+": el verde es ganancia y el aporte
//    es plata que pusiste tu (regla central del proyecto). aportes en champan,
//    retiros en neutro, y el texto lo dice ("no cuenta como ganancia").
//  - los montos van en la moneda nativa de cada cuenta, sin convertir.
export function ActividadReciente({ grupos }: { grupos: GrupoActividad[] }) {
  return (
    <section className="card p-5" aria-labelledby="actividad-titulo">
      <div className="flex items-center justify-between gap-3">
        <h2 id="actividad-titulo" className="titulo-bloque">
          Actividad reciente
        </h2>
        <Link
          href="/cuentas"
          className="no-print inline-flex min-h-11 items-center text-small font-semibold text-accent no-underline rounded hover:text-accent-hi focus-visible:outline-2 focus-visible:outline-accent"
        >
          Ver cuentas
        </Link>
      </div>
      <p className="-mt-1 text-micro text-fg-muted">Aportes y retiros: es tu dinero entrando o saliendo, no ganancia.</p>

      {grupos.length === 0 ? (
        <p className="mt-4 rounded-xl bg-white/[0.02] px-4 py-6 text-center text-small text-fg-muted">
          Todavía no hay aportes ni retiros registrados.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {grupos.map((grupo) => (
            <div key={grupo.etiqueta}>
              <h3 className="text-micro font-semibold text-fg-subtle">{grupo.etiqueta}</h3>
              <ul className="mt-1 lista-filas">
                {grupo.items.map((item) => {
                  const esAporte = item.tipo === "aporte";
                  const Icono = esAporte ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <li key={item.clave} className="flex items-center gap-3 py-2.5">
                      <span
                        aria-hidden="true"
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                          esAporte ? "bg-accent/12 text-accent-hi" : "bg-white/[0.06] text-fg-soft"
                        }`}
                      >
                        <Icono size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-medium text-fg" title={item.cuentaNombre}>{item.cuentaNombre}</p>
                        <p className="truncate text-micro text-fg-muted">
                          {esAporte ? "Aporte" : "Retiro"} · {formatoFecha(item.fecha)}
                        </p>
                      </div>
                      <p className="money-value shrink-0 font-mono-tabular text-small font-semibold text-fg">
                        <span className="sr-only">{esAporte ? "Aporte de " : "Retiro de "}</span>
                        {esAporte ? "" : "−"}
                        {formatoMontoNativo(item.monto, item.moneda)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
