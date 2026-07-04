import { Ayuda } from "@/components/Ayuda";

interface PortfolioSummaryProps {
  valorTotal: number;
  valorTotalAnterior: number;
  // acumulado desde que se creo cada cuenta (capital_por_cuenta), no semanal
  // -- es la misma cifra que ya muestra CapitalSummary, promovida aca a
  // metrica protagonista porque es la que responde "cuanto gane realmente",
  // la pregunta central de este proyecto.
  capitalAportadoClp: number;
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

export function PortfolioSummary({ valorTotal, valorTotalAnterior, capitalAportadoClp }: PortfolioSummaryProps) {
  const gananciaReal = valorTotal - capitalAportadoClp;
  const gananciaRealPct = capitalAportadoClp > 0 ? (gananciaReal / capitalAportadoClp) * 100 : null;
  const gananciaEsPositiva = gananciaReal >= 0;

  const cambioNominal = valorTotal - valorTotalAnterior;
  const cambioNominalPct = valorTotalAnterior > 0 ? (cambioNominal / valorTotalAnterior) * 100 : 0;
  const cambioEsPositivo = cambioNominal >= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-gray-50 p-5">
        <p className="text-sm text-gray-500">ganancia real (acumulado)</p>
        <p
          className={`mt-1 flex items-baseline gap-2 text-3xl font-semibold ${
            gananciaEsPositiva ? "text-green-700" : "text-red-700"
          }`}
        >
          <span aria-hidden className="text-2xl leading-none">
            {gananciaEsPositiva ? "▲" : "▼"}
          </span>
          <span>
            {gananciaEsPositiva ? "+" : ""}
            {formatoPesos(gananciaReal)}
          </span>
          {gananciaRealPct !== null && (
            <span className="text-lg font-medium">({gananciaRealPct.toFixed(1)}%)</span>
          )}
        </p>
        <Ayuda>
          Cuánto has ganado de verdad, descontando todo lo que has aportado, desde que creaste cada
          cuenta. Es la cifra más importante de este dashboard — no confundir con el "cambio
          nominal" de más abajo, que sí puede incluir aportes.
        </Ayuda>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">valor total del portafolio</p>
          <p className="text-base font-medium mt-1">{formatoPesos(valorTotal)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">cambio nominal esta semana</p>
          <p className={`text-base font-medium mt-1 ${cambioEsPositivo ? "text-green-700" : "text-red-700"}`}>
            {cambioEsPositivo ? "+" : ""}
            {formatoPesos(cambioNominal)} ({cambioNominalPct.toFixed(1)}%)
          </p>
          <Ayuda>
            "Nominal" incluye cualquier aporte o retiro que hayas hecho esta semana — no es tu
            ganancia real, que está arriba.
          </Ayuda>
        </div>
      </div>
    </div>
  );
}
