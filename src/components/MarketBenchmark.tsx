import { Ayuda } from "@/components/Ayuda";
import { formatoPct } from "@/lib/formato";
import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  sp500: CambioIndice | null;
  uf: CambioIndice | null;
  // mismo calculo que el "ganancia total / capital aportado" de Hero.tsx,
  // reusando los mismos totales ya derivados en dashboard/page.tsx -- no es
  // un numero nuevo, solo se presenta aca ademas en forma de anillo.
  rendimientoRealPct: number | null;
}

// el llenado del anillo es puramente decorativo (no una escala real de 0-100%):
// un +-25% de rendimiento ya se ve "lleno", igual que en el mockup de diseño.
// stroke-dashoffset=25 rota el inicio del arco a las 12 en punto (25% de 100).
function Ring({ label, pct }: { label: string; pct: number }) {
  const esPositivo = pct >= 0;
  const color = esPositivo ? "var(--pos)" : "var(--neg)";
  const relleno = Math.min(100, Math.abs(pct) * 4);
  const dasharray = `${relleno.toFixed(2)} ${(100 - relleno).toFixed(2)}`;

  return (
    <div className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1 min-w-0">
      <svg viewBox="0 0 36 36" width="32" height="32" className="shrink-0">
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={dasharray}
          strokeDashoffset="25"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[9.5px] font-semibold text-[#5B6472] whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </p>
        <p className="font-mono-tabular mt-px text-xs font-semibold" style={{ color }}>
          {formatoPct(pct)}
        </p>
      </div>
    </div>
  );
}

export function MarketBenchmark({ sp500, uf, rendimientoRealPct }: MarketBenchmarkProps) {
  if (!sp500 && !uf && rendimientoRealPct == null) return null;

  return (
    <div className="flex items-center gap-2 mt-3.5 flex-wrap">
      {rendimientoRealPct != null && <Ring label="Rendimiento real" pct={rendimientoRealPct} />}
      {uf && <Ring label="vs UF (1m)" pct={uf.pct} />}
      {sp500 && <Ring label="vs S&P 500 (1m)" pct={sp500.pct} />}
      <Ayuda>
        El primer anillo es tu rendimiento real acumulado (ganancia total sobre capital aportado).
        Los otros son referencias de mercado del último mes para comparar a grandes rasgos si
        conviene estar invertido: la UF mide si le ganas a la inflación chilena, el S&P 500 cómo se
        movió el mercado bursátil de EE.UU. Ninguna de las dos usa el mismo período exacto que
        &quot;cambio nominal esta semana&quot;.
      </Ayuda>
    </div>
  );
}
