import { Ayuda } from "@/components/Ayuda";
import { formatoFecha, formatoPct } from "@/lib/formato";
import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  sp500: CambioIndice | null;
  uf: CambioIndice | null;
  // mismo calculo que el "ganancia total / capital aportado" de Hero.tsx,
  // reusando los totales ya derivados en dashboard/page.tsx -- no es un
  // numero nuevo, solo se presenta ademas en forma de anillo.
  rendimientoRealPct: number | null;
}

// un comparador: rotulo, cifra y periodo. sin anillos ni graficos
// decorativos (el anillo no tenia escala real). el rotulo y el periodo
// ENVUELVEN, nunca se recortan: en 320 px se leen completos. sin dato ->
// "No disponible", en vez de esconder el comparador.
function Comparador({ rotulo, detalle, pct }: { rotulo: string; detalle: string; pct: number | null }) {
  const color = pct == null ? "var(--color-fg-muted)" : pct >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  return (
    <li className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 sm:block sm:py-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
      <div className="min-w-0">
        <p className="text-small font-medium leading-snug text-fg-soft">{rotulo}</p>
        <p className="mt-0.5 text-micro leading-snug text-fg-muted">{detalle}</p>
      </div>
      <p
        className={`shrink-0 font-mono-tabular font-semibold sm:mt-2 ${pct != null ? "text-lg" : "text-small"}`}
        style={{ color }}
      >
        {pct != null ? formatoPct(pct) : "No disponible"}
      </p>
    </li>
  );
}

export function MarketBenchmark({ sp500, uf, rendimientoRealPct }: MarketBenchmarkProps) {
  if (!sp500 && !uf && rendimientoRealPct == null) return null;

  return (
    <section aria-label="Comparadores de mercado">
      <div className="mb-3.5 flex items-center gap-1">
        <h2 className="titulo-bloque">Comparadores</h2>
        <Ayuda>
          El primero es tu rendimiento real acumulado (ganancia total sobre capital aportado), desde que
          creaste cada cuenta. Los otros son referencias de mercado del último mes: la UF mide si le ganas a
          la inflación chilena y el S&amp;P 500, cómo se movió el mercado bursátil de EE.UU. Los períodos son
          distintos, así que sirven para ubicarte a grandes rasgos, no para una comparación exacta.
        </Ayuda>
      </div>
      <ul className="lista-filas sm:grid sm:grid-cols-3 sm:divide-x sm:divide-[var(--color-edge)] sm:[&>*+*]:border-t-0">
        {rendimientoRealPct != null && (
          <Comparador rotulo="Tu rendimiento real" detalle="Acumulado, sobre tu capital aportado" pct={rendimientoRealPct} />
        )}
        <Comparador
          rotulo="UF (inflación chilena)"
          detalle={uf ? `${formatoFecha(uf.fechaInicio)} → ${formatoFecha(uf.fechaFin)}` : "Sin conexión con el servicio"}
          pct={uf?.pct ?? null}
        />
        <Comparador
          rotulo="S&P 500 (mercado de EE.UU.)"
          detalle={
            sp500 ? `${formatoFecha(sp500.fechaInicio)} → ${formatoFecha(sp500.fechaFin)}` : "Sin conexión con el servicio"
          }
          pct={sp500?.pct ?? null}
        />
      </ul>
    </section>
  );
}
