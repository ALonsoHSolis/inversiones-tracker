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
      <p className="text-sm font-medium mb-3">por plataforma</p>
      <div className="flex flex-col gap-3">
        {plataformas.map((p) => {
          const ganancia = p.valorActualClp - p.capitalAportadoClp;
          const gananciaPct = p.capitalAportadoClp > 0 ? (ganancia / p.capitalAportadoClp) * 100 : null;
          const esPositivo = ganancia >= 0;

          return (
            <div key={p.nombre} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{p.nombre}</span>
              <div className="text-right">
                <p className="font-medium">{formatoPesos(p.valorActualClp)}</p>
                {gananciaPct !== null && (
                  <p className={`text-xs ${esPositivo ? "text-green-700" : "text-red-700"}`}>
                    {esPositivo ? "+" : ""}
                    {formatoPesos(ganancia)} ({gananciaPct.toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
