"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import type { EvolucionPortafolio } from "@/types/database";

interface PortfolioChartProps {
  datos: EvolucionPortafolio[];
}

interface Punto {
  fecha: string;
  capitalAportadoClp: number;
  gananciaClp: number;
}

function formatoPesos(valor: number) {
  return valor.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatoFecha(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

// tooltip propio en vez del formatter generico de recharts: necesitamos
// mostrar capital aportado y ganancia por separado (con su propio color
// segun signo), no solo el valor de la serie que esta bajo el cursor.
function TooltipPersonalizado({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Punto }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0].payload;
  const esPositivo = punto.gananciaClp >= 0;

  return (
    <div className="rounded border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-1">{formatoFecha(punto.fecha)}</p>
      <p>
        capital aportado: <span className="font-medium">{formatoPesos(punto.capitalAportadoClp)}</span>
      </p>
      <p className={esPositivo ? "text-green-700" : "text-red-700"}>
        ganancia:{" "}
        <span className="font-medium">
          {esPositivo ? "+" : ""}
          {formatoPesos(punto.gananciaClp)}
        </span>
      </p>
      <p className="text-gray-500 mt-1">
        total: {formatoPesos(punto.capitalAportadoClp + punto.gananciaClp)}
      </p>
    </div>
  );
}

export function PortfolioChart({ datos }: PortfolioChartProps) {
  const puntos: Punto[] = datos
    .filter((d) => d.fecha !== null && d.valor_total_clp !== null && d.capital_aportado_acumulado_clp !== null)
    .map((d) => ({
      fecha: d.fecha!,
      capitalAportadoClp: d.capital_aportado_acumulado_clp!,
      gananciaClp: d.valor_total_clp! - d.capital_aportado_acumulado_clp!,
    }));

  if (puntos.length < 2) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">
          todavia no hay suficiente historial para graficar — vuelve cuando tengas al menos dos fechas con
          valores guardados.
        </p>
      </div>
    );
  }

  // color de la ganancia segun su signo actual (mismo criterio ya usado en
  // AccountRow/CapitalSummary/PlatformBreakdown: un solo color para toda la
  // serie basado en el ultimo dato, no un gradiente por punto -- el tooltip
  // si distingue el signo correcto en cada fecha puntual).
  const gananciaEsPositivaHoy = puntos[puntos.length - 1].gananciaClp >= 0;
  const colorGanancia = gananciaEsPositivaHoy ? "#15803d" : "#b91c1c";

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">evolucion del portafolio</p>
        <Ayuda>
          El area gris es el capital que has aportado, acumulado (crece en escalones, cuando haces
          un aporte o retiro). El area verde o roja encima es tu ganancia o pérdida real sobre ese
          capital. La suma de ambas es el valor total de tu portafolio en pesos ese día.
        </Ayuda>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={puntos} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="fecha"
              tickFormatter={formatoFecha}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(valor: number) => formatoPesos(valor)}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<TooltipPersonalizado />} />
            <Area
              type="stepAfter"
              dataKey="capitalAportadoClp"
              stackId="portafolio"
              name="capital aportado"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.45}
            />
            <Area
              // mismo tipo de interpolacion que el area de abajo (stepAfter),
              // a proposito: mezclar step con monotone en un area apilada
              // hace que recharts dibuje el borde superior combinado con un
              // "corte" visual en cada transicion, porque cada serie
              // interpola distinto entre los mismos puntos. ademas, la
              // ganancia tampoco se conoce de forma continua entre dos
              // snapshots -- un escalon es mas honesto que una linea suave.
              type="stepAfter"
              dataKey="gananciaClp"
              stackId="portafolio"
              name="ganancia"
              stroke={colorGanancia}
              fill={colorGanancia}
              fillOpacity={0.35}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
