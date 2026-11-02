import { Ayuda } from "@/components/Ayuda";
import { CountUp } from "@/components/CountUp";
import { formatoFecha, formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarClock, Coins, TrendingDown, TrendingUp } from "lucide-react";

interface HeroProps {
  valorTotal: number;
  valorTotalAnterior: number;
  capitalAportadoClp: number;
  valorActualClp: number;
  // fecha (yyyy-mm-dd) del registro mas reciente entre todas las cuentas; null
  // si no hay ninguno. solo se muestra lo que respalda un dato real.
  ultimaActualizacion: string | null;
  // true si alguna cuenta esta en USD o UF (para explicar la conversion)
  hayMonedaExtranjera: boolean;
  chart: ReactNode;
  benchmark: ReactNode;
}

// tarjeta protagonista del dashboard. jerarquia:
//   1. el valor total (la cifra grande),
//   2. la GANANCIA REAL -- la razon de ser del producto: un aporte no es
//      ganancia -- con una barra que separa capital aportado de ganancia,
//   3. el cambio nominal de la semana, deliberadamente pequeno (incluye
//      aportes, asi que no es tu ganancia),
// y debajo, el grafico de evolucion a todo el ancho y los comparadores.
export function Hero({
  valorTotal,
  valorTotalAnterior,
  capitalAportadoClp,
  valorActualClp,
  ultimaActualizacion,
  hayMonedaExtranjera,
  chart,
  benchmark,
}: HeroProps) {
  const cambioNominal = valorTotal - valorTotalAnterior;
  const cambioNominalPct = valorTotalAnterior > 0 ? (cambioNominal / valorTotalAnterior) * 100 : 0;
  const cambioEsPositivo = cambioNominal >= 0;

  const gananciaTotal = valorActualClp - capitalAportadoClp;
  const gananciaPct = capitalAportadoClp > 0 ? (gananciaTotal / capitalAportadoClp) * 100 : null;
  const gananciaEsPositiva = gananciaTotal >= 0;
  const colorGanancia = gananciaEsPositiva ? "var(--color-pos)" : "var(--color-neg)";

  // barra: con ganancia, [capital | ganancia] sobre el valor actual; con
  // perdida, [lo que queda del capital | perdida] sobre el capital aportado.
  const baseBarra = Math.max(capitalAportadoClp, valorActualClp);
  const capitalPctBarra = baseBarra > 0 ? (Math.min(capitalAportadoClp, valorActualClp) / baseBarra) * 100 : 0;
  const deltaPctBarra = baseBarra > 0 ? (Math.abs(gananciaTotal) / baseBarra) * 100 : 0;

  const IconoCambio = cambioEsPositivo ? ArrowUpRight : ArrowDownRight;
  const IconoGanancia = gananciaEsPositiva ? TrendingUp : TrendingDown;

  return (
    <section className="card card-hero px-5 pt-6 pb-5 sm:px-7 sm:pt-7 animate-fade-up" aria-label="Resumen del portafolio">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 lg:gap-10 lg:items-center">
        <div className="min-w-0">
          <h2 className="etiqueta">Patrimonio total</h2>
          <p className="money-value cifra-xl font-mono-tabular mt-2.5 text-fg">
            <CountUp valor={valorTotal} formato="pesos" claveSesion="valor-total" />
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-tabular text-small font-semibold"
              style={{
                color: cambioEsPositivo ? "var(--color-pos)" : "var(--color-neg)",
                background: cambioEsPositivo ? "rgba(65,215,170,0.1)" : "rgba(255,120,133,0.1)",
              }}
            >
              <IconoCambio size={14} strokeWidth={2.2} aria-hidden="true" />
              <span className="money-value">{formatoPesosSigned(cambioNominal)}</span>
              <span className="font-medium opacity-85">· {formatoPct(cambioNominalPct)}</span>
            </span>
            <span className="text-small text-fg-muted">vs. registro anterior · incluye aportes</span>
            <Ayuda etiqueta="Qué es el cambio desde el registro anterior">
              Es el cambio nominal del valor total desde el registro anterior de cada cuenta. Incluye
              cualquier aporte o retiro, así que no es tu ganancia: la ganancia real se muestra aparte.
            </Ayuda>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4 sm:p-5 shadow-[inset_0_0_0_1px_var(--color-edge)]">
          <div className="flex items-center gap-1">
            <h2 className="etiqueta">Ganancia real</h2>
            <Ayuda etiqueta="Cómo se calcula la ganancia real">
              &quot;Capital aportado&quot; es todo lo que depositaste menos lo que retiraste, sumando todas tus
              cuentas desde que las creaste. &quot;Valor actual&quot; es cuánto valen hoy. La ganancia real es la
              diferencia: lo que tu dinero produjo, sin contar lo que tú pusiste.
            </Ayuda>
          </div>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1" style={{ color: colorGanancia }}>
            <span className="inline-flex items-center gap-1.5 money-value font-mono-tabular text-[clamp(1.5rem,6vw,1.875rem)] font-semibold leading-tight tracking-[-0.02em]">
              <IconoGanancia size={20} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
              <CountUp valor={gananciaTotal} formato="pesosSigned" claveSesion="ganancia-total" />
            </span>
            {gananciaPct !== null && (
              <span className="font-mono-tabular text-base font-semibold">{formatoPct(gananciaPct)}</span>
            )}
          </p>

          <div
            className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.06]"
            role="img"
            aria-label={`Del valor actual, el capital aportado es ${capitalPctBarra.toFixed(0)}% y la ${
              gananciaEsPositiva ? "ganancia" : "pérdida"
            } ${deltaPctBarra.toFixed(0)}%`}
          >
            <div className="h-full rounded-l-full bg-accent/75" style={{ width: `${capitalPctBarra}%` }} />
            <div className="h-full rounded-r-full" style={{ width: `${deltaPctBarra}%`, background: colorGanancia }} />
          </div>

          <dl className="mt-3.5 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-micro text-fg-muted">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm bg-accent/75" />
                Capital aportado
              </dt>
              <dd className="money-value mt-1 font-mono-tabular text-[15px] font-semibold text-fg">
                {formatoPesos(capitalAportadoClp)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-micro text-fg-muted">
                <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: colorGanancia }} />
                Valor actual
              </dt>
              <dd className="money-value mt-1 font-mono-tabular text-[15px] font-semibold text-fg">
                {formatoPesos(valorActualClp)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-micro text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Coins size={14} strokeWidth={1.8} aria-hidden="true" className="text-fg-subtle" />
          Consolidado en pesos (CLP)
          {hayMonedaExtranjera && " · USD y UF a la tasa de cada registro, no la de hoy"}
        </span>
        {ultimaActualizacion && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock size={14} strokeWidth={1.8} aria-hidden="true" className="text-fg-subtle" />
            Último registro <span className="font-mono-tabular text-fg-soft">{formatoFecha(ultimaActualizacion)}</span>
          </span>
        )}
      </p>

      <div className="mt-6 border-t border-[var(--color-edge)] pt-5">{chart}</div>
      {benchmark && <div className="mt-5 border-t border-[var(--color-edge)] pt-5">{benchmark}</div>}
    </section>
  );
}
