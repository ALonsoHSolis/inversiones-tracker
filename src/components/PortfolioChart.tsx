"use client";

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import { formatoPesos, formatoPesosSigned } from "@/lib/formato";
import type { EvolucionPortafolio } from "@/types/database";

interface PortfolioChartProps {
  datos: EvolucionPortafolio[];
}

interface Punto {
  fecha: string;
  capitalAportadoClp: number;
  gananciaClp: number;
  totalClp: number;
}

const PERIODOS = ["1M", "3M", "6M", "1A", "Máx"] as const;
type Periodo = (typeof PERIODOS)[number];
const DIAS_POR_PERIODO: Record<Exclude<Periodo, "Máx">, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 182,
  "1A": 365,
};

function formatoFechaCorta(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

function formatoMes(fechaIso: string) {
  const mes = new Date(fechaIso).toLocaleDateString("es-CL", { month: "short", timeZone: "UTC" });
  return mes.replace(".", "");
}

// tooltip propio en vez del formatter generico de recharts: necesitamos
// mostrar capital aportado y ganancia por separado (con su propio color
// segun signo), no solo el valor de la serie que esta bajo el cursor --
// estilo tomado del tooltip oscuro de Dashboard.dc.html.
function TooltipPersonalizado({ active, payload }: { active?: boolean; payload?: { payload: Punto }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0].payload;
  const esPositivo = punto.gananciaClp >= 0;

  return (
    <div className="rounded-[10px] bg-[#171A20] px-3 py-2.5 min-w-[148px] shadow-[0_6px_18px_rgba(20,30,50,0.24)]">
      <p className="text-[10.5px] text-[#AEB5C0] mb-1.5">{formatoFechaCorta(punto.fecha)}</p>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-[2px] bg-[#C3CBD6]" />
        <span className="text-[10.5px] text-[#AEB5C0]">Capital</span>
        <span className="font-mono-tabular text-[11.5px] font-semibold text-white ml-auto">
          {formatoPesos(punto.capitalAportadoClp)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-[2px]" style={{ background: "rgba(11, 122, 84, 0.55)" }} />
        <span className="text-[10.5px] text-[#AEB5C0]">Ganancia</span>
        <span
          className="font-mono-tabular text-[11.5px] font-semibold ml-auto"
          style={{ color: esPositivo ? "var(--pos)" : "var(--neg)" }}
        >
          {formatoPesosSigned(punto.gananciaClp)}
        </span>
      </div>
    </div>
  );
}

export function PortfolioChart({ datos }: PortfolioChartProps) {
  const [periodo, setPeriodo] = useState<Periodo>("6M");

  const todosLosPuntos: Punto[] = useMemo(
    () =>
      datos
        .filter((d) => d.fecha !== null && d.valor_total_clp !== null && d.capital_aportado_acumulado_clp !== null)
        .map((d) => ({
          fecha: d.fecha!,
          capitalAportadoClp: d.capital_aportado_acumulado_clp!,
          gananciaClp: d.valor_total_clp! - d.capital_aportado_acumulado_clp!,
          totalClp: d.valor_total_clp!,
        })),
    [datos]
  );

  const puntos = useMemo(() => {
    if (periodo === "Máx" || todosLosPuntos.length === 0) return todosLosPuntos;
    const ultimaFecha = new Date(todosLosPuntos[todosLosPuntos.length - 1].fecha).getTime();
    const desde = ultimaFecha - DIAS_POR_PERIODO[periodo] * 24 * 60 * 60 * 1000;
    const filtrados = todosLosPuntos.filter((p) => new Date(p.fecha).getTime() >= desde);
    // si el periodo elegido deja muy pocos puntos (cuenta recien creada, poco
    // historial), se prefiere mostrar todo el historial disponible antes que
    // un grafico vacio o con un solo punto.
    return filtrados.length >= 2 ? filtrados : todosLosPuntos;
  }, [todosLosPuntos, periodo]);

  if (todosLosPuntos.length < 2) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12.5px] font-semibold text-[#40474F]">Evolución del portafolio</p>
        </div>
        <p className="text-[12.5px] text-[#A0A7B2] py-8 text-center">
          todavía no hay suficiente historial para graficar — vuelve cuando tengas al menos dos fechas
          con valores guardados.
        </p>
      </div>
    );
  }

  const gananciaEsPositivaHoy = puntos[puntos.length - 1].gananciaClp >= 0;
  const colorGanancia = gananciaEsPositivaHoy ? "#0B7A54" : "#C0392B";
  const rellenoGanancia = gananciaEsPositivaHoy ? "rgba(11, 122, 84, 0.18)" : "rgba(192, 57, 43, 0.16)";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[12.5px] font-semibold text-[#40474F]">Evolución del portafolio</p>
          <Ayuda>
            El área gris es el capital que has aportado, acumulado (crece en escalones, cuando haces
            un aporte o retiro). El área verde o roja encima es tu ganancia o pérdida real sobre ese
            capital. La línea del valor total va sobre ambas.
          </Ayuda>
        </div>
        <div className="flex gap-0.5 bg-[#F3F4F7] p-[3px] rounded-[9px]">
          {PERIODOS.map((p) => {
            const activo = p === periodo;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                className="h-6 px-2.5 rounded-md text-xs font-semibold"
                style={{
                  background: activo ? "#fff" : "transparent",
                  color: activo ? "#171A20" : "#8A929E",
                  boxShadow: activo ? "0 1px 2px rgba(20,30,50,.12)" : "none",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={puntos} margin={{ top: 14, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid horizontal vertical={false} stroke="#EFF1F5" />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatoMes}
              tick={{ fontSize: 10.5, fill: "#A8AEB8" }}
              axisLine={{ stroke: "#EFF1F5" }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: "var(--accent)", strokeOpacity: 0.26 }} />
            <Area
              type="stepAfter"
              dataKey="capitalAportadoClp"
              stackId="portafolio"
              stroke="#C3CBD6"
              strokeWidth={1.4}
              fill="#E4E8EF"
              isAnimationActive={false}
            />
            <Area
              // el area de ganancia usa el mismo tipo de interpolacion
              // (stepAfter) que la de capital a proposito: recharts dibuja el
              // borde inferior de esta area (= borde superior de la de
              // capital) con el "type" de cada Area por separado, asi que un
              // tipo distinto entre ambas deja un "corte" visual en cada
              // transicion. por la misma razon, la linea de valor total de
              // abajo usa stepAfter en vez de una curva organica: para
              // calzar exacto con el borde superior de esta area apilada
              // (capital + ganancia == total en cada punto).
              type="stepAfter"
              dataKey="gananciaClp"
              stackId="portafolio"
              stroke={colorGanancia}
              strokeOpacity={0.55}
              strokeWidth={1}
              fill={rellenoGanancia}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="totalClp"
              stroke="var(--accent)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4.5, fill: "#fff", stroke: "var(--accent)", strokeWidth: 2.4 }}
              isAnimationActive
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#E4E8EF] border border-[#C3CBD6]" />
          Capital aportado
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280]">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "rgba(11, 122, 84, 0.3)" }} />
          Ganancia real
        </span>
      </div>
    </div>
  );
}
