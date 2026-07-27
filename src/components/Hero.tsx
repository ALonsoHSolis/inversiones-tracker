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

// combina lo que antes eran PortfolioSummary y CapitalSummary en una sola
// tarjeta protagonista: numero grande = valor total del portafolio (con su
// cambio nominal semanal debajo), y una fila de tres cifras acumuladas desde
// que se creo cada cuenta (capital aportado / valor actual / ganancia total)
// -- estructura tomada del hero de Dashboard.dc.html.
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

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[28px] border border-white/[0.08] rounded-[18px] px-7 py-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,1fr)_minmax(360px,1.35fr)] gap-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#7C8798]">
            Valor total del portafolio
          </p>
          <p className="money-value mt-2.5 font-mono-tabular font-semibold text-[44px] leading-none tracking-[-0.02em] text-[#F2F5F9]">
            {formatoPesos(valorTotal)}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-3.5 py-1 pl-2.5 pr-3 rounded-full"
            style={{ background: cambioEsPositivo ? "rgba(62,217,163,0.14)" : "rgba(255,107,107,0.14)" }}
          >
            <span className="text-[11px]" style={{ color: cambioEsPositivo ? "var(--pos)" : "var(--neg)" }}>
              {cambioEsPositivo ? "▲" : "▼"}
            </span>
            <span
              className="money-value font-mono-tabular text-[13.5px] font-semibold"
              style={{ color: cambioEsPositivo ? "var(--pos)" : "var(--neg)" }}
            >
              {formatoPesosSigned(cambioNominal)}
            </span>
            <span
              className="text-[12.5px] font-semibold"
              style={{ color: cambioEsPositivo ? "var(--pos)" : "var(--neg)" }}
            >
              ({formatoPct(cambioNominalPct)})
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <p className="text-xs text-[#8892A0]">cambio nominal esta semana</p>
            <Ayuda>
              &quot;Nominal&quot; incluye cualquier aporte o retiro que hayas hecho esta semana — no es
              tu ganancia real, que se muestra abajo como &quot;ganancia total&quot;.
            </Ayuda>
          </div>

          <div className="h-px bg-white/[0.07] my-5" />

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <p className="text-[11px] font-medium text-[#8892A0]">Capital aportado</p>
              <p className="money-value mt-1 font-mono-tabular font-semibold text-base text-[#F2F5F9]">
                {formatoPesos(capitalAportadoClp)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#8892A0]">Valor actual</p>
              <p className="money-value mt-1 font-mono-tabular font-semibold text-base text-[#F2F5F9]">
                {formatoPesos(valorActualClp)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-medium text-[#8892A0]">Ganancia total</p>
                <Ayuda>
                  &quot;Capital aportado&quot; es todo lo que depositaste menos lo que retiraste, sumando
                  todas tus cuentas desde que las creaste. &quot;Valor actual&quot; es cuánto valen hoy.
                  &quot;Ganancia total&quot; es la diferencia real entre ambos — no confundir con el
                  cambio nominal de arriba.
                </Ayuda>
              </div>
              <p
                className="money-value mt-1 font-mono-tabular font-semibold text-base"
                style={{ color: gananciaEsPositiva ? "var(--pos)" : "var(--neg)" }}
              >
                {formatoPesosSigned(gananciaTotal)}
                {gananciaPct !== null && (
                  <span className="text-[12.5px]"> ({formatoPct(gananciaPct)})</span>
                )}
              </p>
            </div>
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
