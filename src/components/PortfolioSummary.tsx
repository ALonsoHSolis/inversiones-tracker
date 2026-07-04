import { Ayuda } from "@/components/Ayuda";

interface PortfolioSummaryProps {
  valorTotal: number;
  valorTotalAnterior: number;
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function PortfolioSummary({ valorTotal, valorTotalAnterior }: PortfolioSummaryProps) {
  const cambio = valorTotal - valorTotalAnterior;
  const cambioPct = valorTotalAnterior > 0 ? (cambio / valorTotalAnterior) * 100 : 0;
  const esPositivo = cambio >= 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">valor total del portafolio</p>
        <p className="text-2xl font-medium mt-1">{formatoPesos(valorTotal)}</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">cambio nominal esta semana</p>
        <p className={`text-2xl font-medium mt-1 ${esPositivo ? "text-green-700" : "text-red-700"}`}>
          {esPositivo ? "+" : ""}
          {formatoPesos(cambio)} ({cambioPct.toFixed(1)}%)
        </p>
        <Ayuda>
          "Nominal" incluye cualquier aporte o retiro que hayas hecho esta semana — no es tu
          ganancia real. Para la ganancia neta de aportes, mira el % de cada cuenta más abajo o la
          tarjeta "capital vs. ganancia (acumulado)".
        </Ayuda>
      </div>
    </div>
  );
}
