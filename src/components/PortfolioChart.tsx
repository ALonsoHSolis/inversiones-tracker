"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import type { EvolucionPortafolio } from "@/types/database";

interface PortfolioChartProps {
  datos: EvolucionPortafolio[];
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

export function PortfolioChart({ datos }: PortfolioChartProps) {
  const puntos = datos.filter(
    (d): d is { fecha: string; valor_total_clp: number } => d.fecha !== null && d.valor_total_clp !== null
  );

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

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">evolucion del portafolio</p>
        <Ayuda>
          Valor total de todas tus cuentas activas, en pesos, a lo largo del tiempo. Si una cuenta
          no tiene un registro justo en una fecha, se usa su último valor conocido hasta ese
          momento.
        </Ayuda>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={puntos} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
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
            <Tooltip
              formatter={(valor) => formatoPesos(Number(valor))}
              labelFormatter={(fecha) => (typeof fecha === "string" ? formatoFecha(fecha) : fecha)}
              contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "#e5e7eb" }}
            />
            <Line type="monotone" dataKey="valor_total_clp" stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
