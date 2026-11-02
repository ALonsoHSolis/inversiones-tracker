import { ChevronDown } from "lucide-react";
import { formatoPct, formatoPesos, formatoPesosSigned, formatoPorcentaje } from "@/lib/formato";
import { calcularParticipaciones, UMBRAL_CONCENTRACION, type GrupoEntrada } from "@/lib/distribucion";

// detalle de una distribucion (por plataforma, tipo o categoria): barra
// apilada con el reparto completo y una fila por grupo con su propia barra de
// participacion. colores categoricos (sin verde ni rojo, que quedan para
// ganancia/perdida); el porcentaje siempre va en texto, el color nunca es el
// unico medio. los montos y % salen tal cual de calcularParticipaciones.
export function DistribucionDetalle({ grupos, vacio }: { grupos: GrupoEntrada[]; vacio: string }) {
  if (grupos.length === 0) {
    return <p className="rounded-xl bg-white/[0.02] px-4 py-6 text-center text-small text-fg-muted">{vacio}</p>;
  }
  const partes = calcularParticipaciones(grupos);
  const resumen = partes.map((p) => `${p.nombre} ${p.porcentaje.toFixed(0)}%`).join(", ");

  return (
    <div>
      <div role="img" aria-label={`Reparto: ${resumen}`} className="flex h-2 w-full gap-[3px] overflow-hidden rounded-full">
        {partes.map((p) => (
          <div
            key={p.nombre}
            className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
            style={{ width: `${p.porcentaje}%`, background: p.color }}
          />
        ))}
      </div>

      <ul className="mt-3 lista-filas">
        {partes.map((p) => {
          const altaConcentracion = p.porcentaje >= UMBRAL_CONCENTRACION;
          return (
            <li key={p.nombre}>
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden grid min-h-12 cursor-pointer grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-x-3 rounded-lg py-2.5 transition-colors duration-150 hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: p.color }} />
                      <span className="min-w-0 break-words text-small font-medium text-fg">{p.nombre}</span>
                      <span className="font-mono-tabular text-micro text-fg-muted">{formatoPorcentaje(p.porcentaje)}</span>
                      {altaConcentracion && (
                        <span className="rounded-full bg-warn/12 px-1.5 py-px text-[11px] font-semibold text-warn">
                          Concentrado
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" className="mt-1.5 ml-4 block h-[3px] max-w-[220px] overflow-hidden rounded-full bg-white/[0.05]">
                      <span className="block h-full rounded-full" style={{ width: `${p.porcentaje}%`, background: p.color, opacity: 0.8 }} />
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="money-value block font-mono-tabular text-small font-semibold text-fg">
                      {formatoPesos(p.valorActualClp)}
                    </span>
                    {p.gananciaPct !== null && (
                      <span
                        className="money-value block font-mono-tabular text-micro font-semibold"
                        style={{ color: p.gananciaClp >= 0 ? "var(--color-pos)" : "var(--color-neg)" }}
                      >
                        {formatoPct(p.gananciaPct)}
                        <span className="sr-only"> de ganancia real</span>
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="text-fg-subtle transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="pb-3 pl-4 text-micro leading-relaxed text-fg-muted">
                  <span className="money-value">{formatoPesos(p.capitalAportadoClp)}</span> aportado ·{" "}
                  <span className="money-value">{formatoPesosSigned(p.gananciaClp)}</span> de ganancia real
                  {altaConcentracion && (
                    <>
                      {" · "}
                      <span className="text-warn">más del {UMBRAL_CONCENTRACION}% de tu patrimonio está acá</span>
                    </>
                  )}
                </p>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
