import type { CambioIndice } from "@/lib/mercado";

interface MarketBenchmarkProps {
  datos: CambioIndice | null;
}

export function MarketBenchmark({ datos }: MarketBenchmarkProps) {
  if (!datos) return null;

  const esPositivo = datos.pct >= 0;

  return (
    <p className="mt-2 text-xs text-gray-500">
      S&amp;P 500 (últimos 5 días hábiles):{" "}
      <span className={esPositivo ? "text-green-700" : "text-red-700"}>
        {esPositivo ? "+" : ""}
        {datos.pct.toFixed(1)}%
      </span>
    </p>
  );
}
