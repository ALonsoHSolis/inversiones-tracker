import { Ayuda } from "@/components/Ayuda";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";

interface Categoria {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

interface CategoryBreakdownProps {
  categorias: Categoria[];
}

// a partir de este % del total, se marca como alta concentracion -- solo
// informativo (control patrimonial), nunca una recomendacion de compra o
// venta, y a proposito con tono calmado (punto ambar, no rojo). mismo umbral
// que PlatformBreakdown/AssetTypeBreakdown.
const UMBRAL_CONCENTRACION = 40;

// copia casi identica de PlatformBreakdown.tsx/AssetTypeBreakdown.tsx --
// mismo patron ya establecido en este proyecto (duplicar componentes chicos
// en vez de generalizarlos). solo se muestra si al menos una cuenta tiene
// categoria asignada -- es un campo opcional, la mayoria de los usuarios no
// tiene por que usarlo.
export function CategoryBreakdown({ categorias }: CategoryBreakdownProps) {
  if (categorias.length === 0) return null;
  const total = categorias.reduce((acc, c) => acc + c.valorActualClp, 0);

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Por categoría</p>
        <Ayuda>
          Agrupa tus cuentas por la categoría personalizada que les asignaste (ej.
          &quot;jubilación&quot;, &quot;fondo de emergencia&quot;), sumando el capital aportado y el valor
          actual de las cuentas de esa categoría. Cuentas sin categoría no aparecen aquí.
        </Ayuda>
      </div>
      <p className="text-[11.5px] text-[#8892A0] mb-4">Cómo está repartido tu portafolio según tus propias metas</p>
      <div className="flex flex-col gap-[15px]">
        {categorias.map((c) => {
          const ganancia = c.valorActualClp - c.capitalAportadoClp;
          const gananciaPct = c.capitalAportadoClp > 0 ? (ganancia / c.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const share = total > 0 ? (c.valorActualClp / total) * 100 : 0;
          const altaConcentracion = share >= UMBRAL_CONCENTRACION;

          return (
            <details key={c.nombre} className="group">
              <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer -mx-2 px-2 py-1 rounded-lg transition-colors duration-200 ease-out hover:bg-white/[0.04]">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="text-[13px] font-medium text-[#D7DCE3]">{c.nombre}</span>
                  <span className="money-value font-mono-tabular text-[13px] font-semibold text-[#F2F5F9]">
                    {formatoPesos(c.valorActualClp)}
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
                {formatoPesos(c.capitalAportadoClp)} aportado · {formatoPesosSigned(ganancia)} de ganancia
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
