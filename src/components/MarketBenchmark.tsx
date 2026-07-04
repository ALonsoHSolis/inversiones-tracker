import { Ayuda } from "@/components/Ayuda";
import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  sp500: CambioIndice | null;
  uf: CambioIndice | null;
}

function Chip({ etiqueta, datos }: { etiqueta: string; datos: CambioIndice }) {
  const esPositivo = datos.pct >= 0;
  return (
    <div className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#F3F4F7]">
      <span className="text-[11px] font-medium text-[#6B7280]">{etiqueta}</span>
      <span
        className="font-mono-tabular text-xs font-semibold"
        style={{ color: esPositivo ? "var(--pos)" : "var(--neg)" }}
      >
        {esPositivo ? "+" : "−"}
        {Math.abs(datos.pct).toFixed(1)}%
      </span>
    </div>
  );
}

export function MarketBenchmark({ sp500, uf }: MarketBenchmarkProps) {
  if (!sp500 && !uf) return null;

  return (
    <div className="flex items-center gap-2 mt-3.5">
      {uf && <Chip etiqueta="UF · inflación (5d)" datos={uf} />}
      {sp500 && <Chip etiqueta="S&P 500 (5d)" datos={sp500} />}
      <Ayuda>
        Referencias de mercado para comparar a grandes rasgos si conviene estar invertido: la UF
        mide si le ganas a la inflación chilena, el S&P 500 cómo se movió el mercado bursátil de
        EE.UU. Ninguna de las dos usa el mismo período exacto que &quot;cambio nominal esta
        semana&quot;.
      </Ayuda>
    </div>
  );
}
