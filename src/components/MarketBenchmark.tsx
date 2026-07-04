import { Ayuda } from "@/components/Ayuda";
import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  sp500: CambioIndice | null;
  uf: CambioIndice | null;
}

function Linea({ etiqueta, datos }: { etiqueta: string; datos: CambioIndice }) {
  const esPositivo = datos.pct >= 0;
  return (
    <p className="text-xs text-gray-500">
      {etiqueta}:{" "}
      <span className={esPositivo ? "text-green-700" : "text-red-700"}>
        {esPositivo ? "+" : ""}
        {datos.pct.toFixed(1)}%
      </span>
    </p>
  );
}

export function MarketBenchmark({ sp500, uf }: MarketBenchmarkProps) {
  if (!sp500 && !uf) return null;

  return (
    <div className="mt-2">
      {uf && <Linea etiqueta="UF, inflación (últimos 5 días)" datos={uf} />}
      {sp500 && <Linea etiqueta="S&P 500 (últimos 5 días hábiles)" datos={sp500} />}
      <Ayuda>
        Referencias de mercado para comparar a grandes rasgos si conviene estar invertido: la UF
        mide si le ganas a la inflación chilena, el S&P 500 cómo se movió el mercado bursátil de
        EE.UU. Ninguna de las dos usa el mismo período exacto que "cambio nominal esta semana".
      </Ayuda>
    </div>
  );
}
