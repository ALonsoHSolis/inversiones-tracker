import { Ayuda } from "@/components/Ayuda";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";

interface Plataforma {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

interface PlatformBreakdownProps {
  plataformas: Plataforma[];
}

// a partir de este % del total, se marca como alta concentracion -- solo
// informativo (control patrimonial), nunca una recomendacion de compra o
// venta, y a proposito con tono calmado (punto ambar, no rojo).
const UMBRAL_CONCENTRACION = 40;

export function PlatformBreakdown({ plataformas }: PlatformBreakdownProps) {
  if (plataformas.length === 0) return null;
  const total = plataformas.reduce((acc, p) => acc + p.valorActualClp, 0);

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Por plataforma</p>
        <Ayuda>
          Agrupa tus cuentas por banco o corredora para ver cuánto tienes en cada una, sumando el
          capital aportado y el valor actual de las cuentas de esa plataforma.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#8892A0] mb-4">Cuánto tienes en cada banco o corredora</p>
      <div className="flex flex-col gap-[15px]">
        {plataformas.map((p) => {
          const ganancia = p.valorActualClp - p.capitalAportadoClp;
          const gananciaPct = p.capitalAportadoClp > 0 ? (ganancia / p.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const share = total > 0 ? (p.valorActualClp / total) * 100 : 0;
          const altaConcentracion = share >= UMBRAL_CONCENTRACION;

          return (
            <details key={p.nombre} className="group">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer -mx-2 px-2 py-1 rounded-lg transition-colors duration-200 ease-out hover:bg-white/[0.04]">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-[13px] font-medium text-[#D7DCE3]">{p.nombre}</span>
                  <span className="money-value font-mono-tabular text-[13px] font-semibold text-[#F2F5F9]">
                    {formatoPesos(p.valorActualClp)}
                  </span>
                </div>
                <div className="h-1.5 rounded bg-white/[0.08] my-[7px] mb-[5px] overflow-hidden">
                  <div className="h-full rounded bg-[var(--accent)]" style={{ width: `${share}%` }} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-[#8892A0] font-mono-tabular inline-flex items-center gap-1">
                    {share.toFixed(1)}% del total
                    {altaConcentracion && (
                      <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-[#E8A857]" />
                    )}
                  </span>
                  {gananciaPct !== null && (
                    <span
                      className="money-value text-[11.5px] font-semibold font-mono-tabular"
                      style={{ color: esPositivo ? "var(--pos)" : "var(--neg)" }}
                    >
                      {formatoPct(gananciaPct)}
                    </span>
                  )}
                </div>
              </summary>
              <p className="mt-1.5 text-[11px] text-[#8892A0]">
                {formatoPesos(p.capitalAportadoClp)} aportado · {formatoPesosSigned(ganancia)} de ganancia
                {altaConcentracion && (
                  <>
                    {" · "}
                    <span className="text-[#E8A857]">
                      más del {UMBRAL_CONCENTRACION}% de tu patrimonio está acá
                    </span>
                  </>
                )}
              </p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
