import type { ReactNode } from "react";
import { Ayuda } from "@/components/Ayuda";
import { formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import { calcularParticipaciones, UMBRAL_CONCENTRACION, type GrupoEntrada } from "@/lib/distribucion";

interface DistribucionCardProps {
  titulo: string;
  subtitulo: string;
  ayuda: ReactNode;
  grupos: GrupoEntrada[];
}

// tarjeta de distribucion (por plataforma, tipo o categoria). una barra
// apilada muestra el reparto completo de un vistazo y cada fila repite el
// color de su segmento. los colores son categoricos (sin verde ni rojo, que
// quedan para ganancia/perdida). reemplaza a PlatformBreakdown,
// AssetTypeBreakdown y CategoryBreakdown, que eran copias casi identicas.
export function DistribucionCard({ titulo, subtitulo, ayuda, grupos }: DistribucionCardProps) {
  if (grupos.length === 0) return null;
  const partes = calcularParticipaciones(grupos);
  const resumen = partes.map((p) => `${p.nombre} ${p.porcentaje.toFixed(0)}%`).join(", ");

  return (
    <section className="card p-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-small font-semibold text-fg">{titulo}</h2>
        <Ayuda>{ayuda}</Ayuda>
      </div>
      <p className="mt-1 mb-4 text-micro text-fg-muted">{subtitulo}</p>

      <div
        role="img"
        aria-label={`Reparto: ${resumen}`}
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
      >
        {partes.map((p) => (
          <div
            key={p.nombre}
            className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
            style={{ width: `${p.porcentaje}%`, background: p.color }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-col">
        {partes.map((p) => {
          const altaConcentracion = p.porcentaje >= UMBRAL_CONCENTRACION;
          return (
            <li key={p.nombre} className="border-t border-[var(--line)] first:border-t-0">
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 py-2 transition-colors duration-150 hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-accent">
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: p.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-medium text-fg-soft">{p.nombre}</span>
                    <span className="inline-flex items-center gap-1 text-micro tabular-nums text-fg-muted">
                      {p.porcentaje.toFixed(1)}% del total
                      {altaConcentracion && (
                        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-warn" />
                      )}
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
                      </span>
                    )}
                  </span>
                </summary>
                <p className="px-1 pb-2.5 pl-[22px] text-micro leading-relaxed text-fg-muted">
                  <span className="money-value">{formatoPesos(p.capitalAportadoClp)}</span> aportado ·{" "}
                  <span className="money-value">{formatoPesosSigned(p.gananciaClp)}</span> de ganancia
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
    </section>
  );
}
