"use client";

import { useId, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import { formatoPesos } from "@/lib/formato";

export interface GrupoComposicion {
  nombre: string;
  color: string;
}

export interface PuntoComposicion {
  fecha: string;
  [grupo: string]: string | number;
}

export interface DatosComposicion {
  puntos: PuntoComposicion[];
  grupos: GrupoComposicion[];
}

interface CompositionChartProps {
  porPlataforma: DatosComposicion;
  porTipo: DatosComposicion;
}

const PERIODOS = ["1M", "3M", "6M", "1A", "Máx"] as const;
type Periodo = (typeof PERIODOS)[number];
const DIAS_POR_PERIODO: Record<Exclude<Periodo, "Máx">, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 182,
  "1A": 365,
};

function formatoMes(fechaIso: string) {
  const mes = new Date(fechaIso).toLocaleDateString("es-CL", { month: "short", timeZone: "UTC" });
  return mes.replace(".", "");
}

function formatoFechaCorta(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

// tooltip propio (mismo criterio que PortfolioChart): la cantidad de grupos
// es dinamica (una fila por plataforma o tipo, no un numero fijo), asi que no
// alcanza el formatter generico de recharts.
function TooltipPersonalizado({
  active,
  payload,
  grupos,
}: {
  active?: boolean;
  payload?: { payload: PuntoComposicion }[];
  grupos: GrupoComposicion[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0].payload;

  return (
    <div className="rounded-[10px] bg-[rgba(10,13,19,0.94)] border border-white/[0.1] backdrop-blur-[10px] px-3 py-2.5 min-w-[160px] shadow-[0_14px_34px_rgba(0,0,0,0.5)]">
      <p className="text-[10.5px] text-[#8892A0] mb-1.5">{formatoFechaCorta(punto.fecha)}</p>
      <div className="flex flex-col gap-1">
        {grupos.map((g) => (
          <div key={g.nombre} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: g.color }} />
            <span className="text-[10.5px] text-[#8892A0] truncate max-w-[90px]">{g.nombre}</span>
            <span className="font-mono-tabular text-[11px] font-semibold text-white ml-auto">
              {formatoPesos(Number(punto[g.nombre]) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// grafico de composicion historica por plataforma/tipo -- misma convencion
// recharts que PortfolioChart (ComposedChart, stackId compartido, type
// stepAfter para calzar con el forward-fill de valor_diario_por_cuenta,
// selector de periodo con el mismo estilo de pildoras). el toggle
// plataforma/tipo solo cambia CUAL de los dos conjuntos ya agrupados
// (calculados en dashboard/page.tsx, no aca) se muestra.
export function CompositionChart({ porPlataforma, porTipo }: CompositionChartProps) {
  const [dimension, setDimension] = useState<"plataforma" | "tipo">("plataforma");
  const [periodo, setPeriodo] = useState<Periodo>("6M");
  const gradientId = useId();

  const { puntos: todosLosPuntos, grupos } = dimension === "plataforma" ? porPlataforma : porTipo;

  const puntos = useMemo(() => {
    if (periodo === "Máx" || todosLosPuntos.length === 0) return todosLosPuntos;
    const ultimaFecha = new Date(todosLosPuntos[todosLosPuntos.length - 1].fecha).getTime();
    const desde = ultimaFecha - DIAS_POR_PERIODO[periodo] * 24 * 60 * 60 * 1000;
    const filtrados = todosLosPuntos.filter((p) => new Date(p.fecha).getTime() >= desde);
    return filtrados.length >= 2 ? filtrados : todosLosPuntos;
  }, [todosLosPuntos, periodo]);

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Composición histórica</p>
          <Ayuda>
            Cómo ha evolucionado en el tiempo la distribución de tu portafolio, en pesos, por
            plataforma o por tipo de activo. Cada punto usa el último valor conocido de cada
            cuenta hasta esa fecha — mismo criterio de relleno hacia adelante que el gráfico de
            evolución del portafolio.
          </Ayuda>
        </div>
        <div className="flex gap-0.5 bg-white/[0.04] p-[3px] rounded-[9px]">
          <button
            type="button"
            onClick={() => setDimension("plataforma")}
            className="h-6 px-2.5 rounded-md text-xs font-semibold"
            style={{
              background: dimension === "plataforma" ? "rgba(255,255,255,.1)" : "transparent",
              color: dimension === "plataforma" ? "#F2F5F9" : "#7C8798",
            }}
          >
            Plataforma
          </button>
          <button
            type="button"
            onClick={() => setDimension("tipo")}
            className="h-6 px-2.5 rounded-md text-xs font-semibold"
            style={{
              background: dimension === "tipo" ? "rgba(255,255,255,.1)" : "transparent",
              color: dimension === "tipo" ? "#F2F5F9" : "#7C8798",
            }}
          >
            Tipo
          </button>
        </div>
      </div>

      {todosLosPuntos.length < 2 ? (
        <p className="text-[12.5px] text-[#8892A0] py-8 text-center">
          todavía no hay suficiente historial para graficar — vuelve cuando tengas al menos dos
          fechas con valores guardados.
        </p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <div className="flex gap-0.5 bg-white/[0.04] p-[3px] rounded-[9px]">
              {PERIODOS.map((p) => {
                const activo = p === periodo;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodo(p)}
                    className="h-6 px-2.5 rounded-md text-xs font-semibold"
                    style={{
                      background: activo ? "rgba(255,255,255,.1)" : "transparent",
                      color: activo ? "#F2F5F9" : "#7C8798",
                      boxShadow: activo ? "0 1px 2px rgba(0,0,0,.3)" : "none",
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
                <defs>
                  {grupos.map((g, i) => (
                    <linearGradient key={g.nombre} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={g.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={g.color} stopOpacity={0.04} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,.06)" />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatoMes}
                  tick={{ fontSize: 10.5, fill: "#5B6472" }}
                  axisLine={{ stroke: "rgba(255,255,255,.06)" }}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis hide />
                <Tooltip
                  content={<TooltipPersonalizado grupos={grupos} />}
                  cursor={{ stroke: "var(--accent)", strokeOpacity: 0.26 }}
                />
                {grupos.map((g, i) => (
                  <Area
                    key={g.nombre}
                    type="stepAfter"
                    dataKey={g.nombre}
                    stackId="composicion"
                    stroke={g.color}
                    strokeWidth={1.2}
                    fill={`url(#${gradientId}-${i})`}
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2.5 flex-wrap">
            {grupos.map((g) => (
              <span
                key={g.nombre}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#8892A0]"
              >
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: g.color }} />
                {g.nombre}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
