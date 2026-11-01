import { Ayuda } from "@/components/Ayuda";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";

interface TipoActivo {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

interface AssetTypeBreakdownProps {
  tipos: TipoActivo[];
}

// a partir de este % del total, se marca como alta concentracion -- solo
// informativo (control patrimonial), nunca una recomendacion de compra o
// venta, y a proposito con tono calmado (punto ambar, no rojo).
const UMBRAL_CONCENTRACION = 40;

export function AssetTypeBreakdown({ tipos }: AssetTypeBreakdownProps) {
  if (tipos.length === 0) return null;
  const total = tipos.reduce((acc, t) => acc + t.valorActualClp, 0);

  return (
    <section className="card p-5">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-small font-semibold text-fg">Por tipo de activo</p>
        <Ayuda>
          Agrupa tus cuentas por tipo (fondo mutuo, acciones, depósito a plazo, etc.) para ver cómo
          está repartido tu portafolio, sumando el capital aportado y el valor actual de las
          cuentas de ese tipo.
        </Ayuda>
      </div>
      <p className="text-micro text-fg-muted mb-4">Cómo está repartido tu portafolio</p>
      <div className="flex flex-col gap-[15px]">
        {tipos.map((t) => {
          const ganancia = t.valorActualClp - t.capitalAportadoClp;
          const gananciaPct = t.capitalAportadoClp > 0 ? (ganancia / t.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const share = total > 0 ? (t.valorActualClp / total) * 100 : 0;
          const altaConcentracion = share >= UMBRAL_CONCENTRACION;

          return (
            <details key={t.nombre} className="group">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer -mx-2 px-2 py-1 rounded-lg transition-colors duration-200 ease-out hover:bg-white/[0.04]">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-small font-medium text-fg-soft">{t.nombre}</span>
                  <span className="money-value font-mono-tabular text-small font-semibold text-fg">
                    {formatoPesos(t.valorActualClp)}
                  </span>
                </div>
                <div className="h-1.5 rounded bg-white/[0.08] my-[7px] mb-[5px] overflow-hidden">
                  <div className="h-full rounded bg-[var(--accent)]" style={{ width: `${share}%` }} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-micro text-fg-muted tabular-nums inline-flex items-center gap-1">
                    {share.toFixed(1)}% del total
                    {altaConcentracion && (
                      <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-warn" />
                    )}
                  </span>
                  {gananciaPct !== null && (
                    <span
                      className="money-value text-micro font-semibold font-mono-tabular"
                      style={{ color: esPositivo ? "var(--pos)" : "var(--neg)" }}
                    >
                      {formatoPct(gananciaPct)}
                    </span>
                  )}
                </div>
              </summary>
              <p className="mt-1.5 text-micro text-fg-muted">
                {formatoPesos(t.capitalAportadoClp)} aportado · {formatoPesosSigned(ganancia)} de ganancia
                {altaConcentracion && (
                  <>
                    {" · "}
                    <span className="text-warn">
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
