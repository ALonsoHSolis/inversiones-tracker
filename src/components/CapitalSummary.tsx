interface CapitalSummaryProps {
  capitalAportadoClp: number;
  valorActualClp: number;
  hayCuentas: boolean;
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

// acumulado desde que se creo cada cuenta (no semanal, a diferencia de
// PortfolioSummary), usando capital_por_cuenta. capital_aportado_clp puede
// ser 0 (recien empezando) o negativo (retiros netos > aportes netos) — el
// % de ganancia solo tiene sentido dividiendo por una base positiva.
export function CapitalSummary({ capitalAportadoClp, valorActualClp, hayCuentas }: CapitalSummaryProps) {
  if (!hayCuentas) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">todavia no hay capital aportado.</p>
      </div>
    );
  }

  const gananciaTotal = valorActualClp - capitalAportadoClp;
  const gananciaPct = capitalAportadoClp > 0 ? (gananciaTotal / capitalAportadoClp) * 100 : null;
  const esPositivo = gananciaTotal >= 0;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium mb-3">capital vs. ganancia (acumulado)</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500">capital aportado</p>
          <p className="text-lg font-medium mt-1">{formatoPesos(capitalAportadoClp)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">valor actual</p>
          <p className="text-lg font-medium mt-1">{formatoPesos(valorActualClp)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ganancia total</p>
          <p className={`text-lg font-medium mt-1 ${esPositivo ? "text-green-700" : "text-red-700"}`}>
            {esPositivo ? "+" : ""}
            {formatoPesos(gananciaTotal)}
            {gananciaPct !== null && ` (${gananciaPct.toFixed(1)}%)`}
          </p>
        </div>
      </div>
    </div>
  );
}
