import { Ayuda } from "@/components/Ayuda";
import { colorParaEtiqueta } from "@/lib/etiquetas";

interface TipoActivo {
  nombre: string;
  capitalAportadoClp: number;
  valorActualClp: number;
}

interface AssetTypeBreakdownProps {
  tipos: TipoActivo[];
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function AssetTypeBreakdown({ tipos }: AssetTypeBreakdownProps) {
  if (tipos.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">por tipo de activo</p>
        <Ayuda>
          Agrupa tus cuentas por tipo (fondo mutuo, acciones, depósito a plazo, etc.) para ver cómo
          está repartido tu portafolio, sumando el capital aportado y el valor actual de las
          cuentas de ese tipo. Toca o pasa el cursor sobre la etiqueta para ver el detalle.
        </Ayuda>
      </div>
      <div className="flex flex-col gap-3">
        {tipos.map((t) => {
          const ganancia = t.valorActualClp - t.capitalAportadoClp;
          const gananciaPct = t.capitalAportadoClp > 0 ? (ganancia / t.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;
          const color = colorParaEtiqueta(t.nombre);
          const detalle = `capital aportado: ${formatoPesos(t.capitalAportadoClp)} · valor actual: ${formatoPesos(t.valorActualClp)}`;

          return (
            <details key={t.nombre} className="group">
              <summary className="flex items-center justify-between text-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span
                  title={detalle}
                  className={`inline-flex items-center rounded-full ${color.bg} ${color.texto} text-xs font-medium px-2 py-0.5`}
                >
                  {t.nombre}
                </span>
                <div className="text-right">
                  <p className="font-medium">{formatoPesos(t.valorActualClp)}</p>
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
