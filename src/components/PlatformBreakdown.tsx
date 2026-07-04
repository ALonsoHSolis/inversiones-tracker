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

export function PlatformBreakdown({ plataformas }: PlatformBreakdownProps) {
  if (plataformas.length === 0) return null;
  const total = plataformas.reduce((acc, p) => acc + p.valorActualClp, 0);

  return (
    <section className="bg-white border border-[#E7E9EE] rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold">Por plataforma</p>
        <Ayuda>
          Agrupa tus cuentas por banco o corredora para ver cuánto tienes en cada una, sumando el
          capital aportado y el valor actual de las cuentas de esa plataforma.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#A0A7B2] mb-4">Cuánto tienes en cada banco o corredora</p>
      <div className="flex flex-col gap-[15px]">
        {plataformas.map((p) => {
          const ganancia = p.valorActualClp - p.capitalAportadoClp;
          const gananciaPct = p.capitalAportadoClp > 0 ? (ganancia / p.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const share = total > 0 ? (p.valorActualClp / total) * 100 : 0;

          return (
            <details key={p.nombre} className="group">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-[13px] font-medium text-[#2C333B]">{p.nombre}</span>
                  <span className="money-value font-mono-tabular text-[13px] font-semibold">
                    {formatoPesos(p.valorActualClp)}
                  </span>
                </div>
                <div className="h-1.5 rounded bg-[#EEF1F5] my-[7px] mb-[5px] overflow-hidden">
                  <div className="h-full rounded bg-[var(--accent)]" style={{ width: `${share}%` }} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-[#A0A7B2] font-mono-tabular">
                    {share.toFixed(1)}% del total
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
              <p className="mt-1.5 text-[11px] text-[#A0A7B2]">
                {formatoPesos(p.capitalAportadoClp)} aportado · {formatoPesosSigned(ganancia)} de ganancia
              </p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
