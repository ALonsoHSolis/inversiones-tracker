import { Ayuda } from "@/components/Ayuda";
import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  datos: CambioIndice | null;
}

export function MarketBenchmark({ datos }: MarketBenchmarkProps) {
  if (!datos) return null;

  const esPositivo = datos.pct >= 0;

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500">
        S&amp;P 500 (últimos 5 días hábiles):{" "}
        <span className={esPositivo ? "text-green-700" : "text-red-700"}>
          {esPositivo ? "+" : ""}
          {datos.pct.toFixed(1)}%
        </span>
      </p>
      <Ayuda>
        Referencia de cómo se movió el mercado bursátil de EE.UU. en los últimos días hábiles — no
        es el mismo período exacto que "cambio nominal esta semana", es solo para comparar a
        grandes rasgos si conviene estar invertido versus el mercado en general.
      </Ayuda>
    </div>
  );
}
