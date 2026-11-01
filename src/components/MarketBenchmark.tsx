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

// el llenado del anillo es puramente decorativo (no una escala real de 0-100%):
// un +-25% ya se ve "lleno".
// stroke-dashoffset=25 rota el inicio del arco a las 12 en punto (25% de 100).
function Anillo({ pct }: { pct: number }) {
  const color = pct >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  const relleno = Math.min(100, Math.abs(pct) * 4);
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" className="shrink-0" aria-hidden="true">
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r="15.9155"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${relleno.toFixed(2)} ${(100 - relleno).toFixed(2)}`}
        strokeDashoffset="25"
      />
    </svg>
  );
}

// tarjeta de un comparador. el rotulo y el periodo ENVUELVEN (nunca se
// recortan con "..."): en 320 px se lee completo. sin dato -> "No disponible",
// en vez de esconder el comparador.
function Comparador({ rotulo, detalle, pct }: { rotulo: string; detalle: string; pct: number | null }) {
  const color = pct == null ? "var(--color-fg-muted)" : pct >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white/[0.02] p-3">
      {pct != null ? (
        <Anillo pct={pct} />
      ) : (
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-white/[0.18] text-fg-subtle">
          –
        </span>
      )}
      <div className="min-w-0">
        <p className="text-small font-medium leading-snug text-fg-soft">{rotulo}</p>
        <p className="font-mono-tabular text-base font-semibold" style={{ color }}>
          {pct != null ? formatoPct(pct) : "No disponible"}
        </p>
        <p className="text-micro leading-snug text-fg-muted">{detalle}</p>
      </div>
    </li>
  );
}

export function MarketBenchmark({ sp500, uf, rendimientoRealPct }: MarketBenchmarkProps) {
  if (!sp500 && !uf && rendimientoRealPct == null) return null;

  return (
    <section aria-label="Comparadores de mercado">
      <div className="mb-3 flex items-center gap-1.5">
        <h2 className="text-small font-semibold text-fg">Comparadores</h2>
        <Ayuda>
          El primero es tu rendimiento real acumulado (ganancia total sobre capital aportado), desde que
          creaste cada cuenta. Los otros son referencias de mercado del último mes: la UF mide si le ganas a
          la inflación chilena y el S&amp;P 500, cómo se movió el mercado bursátil de EE.UU. Los períodos son
          distintos, así que sirven para ubicarte a grandes rasgos, no para una comparación exacta.
        </Ayuda>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
