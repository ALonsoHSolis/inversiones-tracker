import { Ayuda } from "@/components/Ayuda";
import { colorParaEtiqueta } from "@/lib/etiquetas";

interface Plataforma {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

interface PlatformBreakdownProps {
  plataformas: Plataforma[];
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function PlatformBreakdown({ plataformas }: PlatformBreakdownProps) {
  if (plataformas.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">por plataforma</p>
        <Ayuda>
          Agrupa tus cuentas por banco o corredora para ver cuánto tienes en cada una, sumando el
          capital aportado y el valor actual de las cuentas de esa plataforma. Toca o pasa el
          cursor sobre la etiqueta para ver el detalle.
        </Ayuda>
      </div>
      <div className="flex flex-col gap-3">
        {plataformas.map((p) => {
          const ganancia = p.valorActualClp - p.capitalAportadoClp;
          const gananciaPct = p.capitalAportadoClp > 0 ? (ganancia / p.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const color = colorParaEtiqueta(p.nombre);
          const detalle = `capital aportado: ${formatoPesos(p.capitalAportadoClp)} · valor actual: ${formatoPesos(p.valorActualClp)}`;

          return (
            <details key={p.nombre} className="group">
              <summary className="flex items-center justify-between text-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span
                  title={detalle}
                  className={`inline-flex items-center rounded-full ${color.bg} ${color.texto} text-xs font-medium px-2 py-0.5`}
                >
                  {p.nombre}
                </span>
                <div className="text-right">
                  <p className="font-medium">{formatoPesos(p.valorActualClp)}</p>
                  {gananciaPct !== null && (
                    <p className={`text-xs ${esPositivo ? "text-green-700" : "text-red-700"}`}>
                      {esPositivo ? "+" : ""}
                      {formatoPesos(ganancia)} ({gananciaPct.toFixed(1)}%)
                    </p>
                  )}
                </div>
              </summary>
              <p className="mt-1 text-xs text-gray-500">{detalle}</p>
            </details>
          );
        })}
      </div>
    </div>
  );
}
