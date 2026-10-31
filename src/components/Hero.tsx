import { Ayuda } from "@/components/Ayuda";
import { formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import type { ReactNode } from "react";

interface HeroProps {
  valorTotal: number;
  valorTotalAnterior: number;
  capitalAportadoClp: number;
  valorActualClp: number;
  chart: ReactNode;
  benchmark: ReactNode;
}

// tarjeta protagonista del dashboard. jerarquia de tres niveles:
//   1. el valor total (la cifra grande),
//   2. la GANANCIA REAL -- la razon de ser del producto: un aporte no es
//      ganancia -- con una barra que separa visualmente capital aportado de
//      ganancia,
//   3. el cambio nominal de la semana, deliberadamente pequeno y debajo
//      (incluye aportes, asi que no es tu ganancia).
export function Hero({
  valorTotal,
  valorTotalAnterior,
  capitalAportadoClp,
  valorActualClp,
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

  return (
    <section className="card px-7 py-7 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_minmax(380px,1.3fr)] gap-10">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            Valor total del portafolio
          </p>
          <p className="money-value mt-3 font-mono-tabular font-medium text-[44px] sm:text-[52px] leading-none tracking-[-0.025em] text-fg">
            {formatoPesos(valorTotal)}
          </p>

          <div className="mt-7">
            <div className="flex items-center gap-1.5">
              <p className="text-micro font-semibold uppercase tracking-[0.12em] text-fg-muted">Ganancia real</p>
              <Ayuda>
                &quot;Capital aportado&quot; es todo lo que depositaste menos lo que retiraste, sumando todas tus
                cuentas desde que las creaste. &quot;Valor actual&quot; es cuánto valen hoy. &quot;Ganancia
                real&quot; es la diferencia entre ambos: lo que tu dinero realmente produjo, sin contar lo que
                tú pusiste.
              </Ayuda>
            </div>
            <p
              className="money-value mt-1.5 font-mono-tabular text-[28px] font-semibold leading-tight tracking-[-0.01em]"
              style={{ color: colorGanancia }}
            >
              {formatoPesosSigned(gananciaTotal)}
              {gananciaPct !== null && <span className="ml-2 text-base font-medium">({formatoPct(gananciaPct)})</span>}
            </p>

            <div
              className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden flex"
              role="img"
              aria-label={`Del valor actual, el capital aportado es ${capitalPctBarra.toFixed(0)}% y la ${
                gananciaEsPositiva ? "ganancia" : "pérdida"
              } ${deltaPctBarra.toFixed(0)}%`}
            >
              <div className="h-full bg-accent/70" style={{ width: `${capitalPctBarra}%` }} />
              <div className="h-full" style={{ width: `${deltaPctBarra}%`, background: colorGanancia }} />
            </div>

            <dl className="mt-3.5 grid grid-cols-2 gap-4">
              <div>
                <dt className="flex items-center gap-1.5 text-micro text-fg-muted">
                  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-sm bg-accent/70" />
                  Capital aportado
                </dt>
                <dd className="money-value mt-1 font-mono-tabular text-sm font-semibold text-fg">
                  {formatoPesos(capitalAportadoClp)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-micro text-fg-muted">
                  <span
                    aria-hidden="true"
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ background: colorGanancia }}
                  />
                  Valor actual
                </dt>
                <dd className="money-value mt-1 font-mono-tabular text-sm font-semibold text-fg">
                  {formatoPesos(valorActualClp)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center gap-2.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 font-mono-tabular text-small font-medium"
              style={{ color: cambioEsPositivo ? "var(--color-pos)" : "var(--color-neg)" }}
            >
              <span aria-hidden="true" className="text-micro">
                {cambioEsPositivo ? "▲" : "▼"}
              </span>
              <span className="money-value">{formatoPesosSigned(cambioNominal)}</span>
              <span>({formatoPct(cambioNominalPct)})</span>
            </span>
            <span className="text-small text-fg-muted">cambio nominal esta semana</span>
            <Ayuda>
              &quot;Nominal&quot; incluye cualquier aporte o retiro que hayas hecho esta semana — no es tu ganancia
              real, que se muestra arriba.
            </Ayuda>
          </div>
        </div>

        <div className="flex flex-col">
          {chart}
          {benchmark}
        </div>
      </div>
    </section>
  );
}
