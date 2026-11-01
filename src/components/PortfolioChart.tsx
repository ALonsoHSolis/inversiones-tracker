"use client";

import { useId, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import { calcularEjeX } from "@/lib/graficos";
import { formatoFecha, formatoPesos, formatoPesosCompacto, formatoPesosSigned } from "@/lib/formato";
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

function formatoDia(fechaIso: string) {
  return new Date(fechaIso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
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
    <div className="rounded-[10px] bg-[rgba(8,13,22,0.94)] border border-white/[0.1] backdrop-blur-[10px] px-3 py-2.5 min-w-[190px] shadow-[0_14px_34px_rgba(0,0,0,0.5)]">
      <p className="text-micro text-fg-muted mb-1.5">{formatoFecha(punto.fecha)}</p>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-[2px] bg-accent" />
        <span className="text-micro text-fg-muted">Valor total</span>
        <span className="font-mono-tabular text-micro font-semibold text-white ml-auto">
          {formatoPesos(punto.totalClp)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-[2px] bg-white/[0.3]" />
        <span className="text-micro text-fg-muted">Capital</span>
        <span className="font-mono-tabular text-micro font-semibold text-white ml-auto">
          {formatoPesos(punto.capitalAportadoClp)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-[2px]" style={{ background: "rgba(65,215,170, 0.6)" }} />
        <span className="text-micro text-fg-muted">Ganancia</span>
        <span
          className="font-mono-tabular text-micro font-semibold ml-auto"
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
  const gradientId = useId();

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

  const { puntos, historialInsuficiente } = useMemo(() => {
    if (periodo === "Máx" || todosLosPuntos.length === 0) {
      return { puntos: todosLosPuntos, historialInsuficiente: false };
    }
    const ultimaFecha = new Date(todosLosPuntos[todosLosPuntos.length - 1].fecha).getTime();
    const desde = ultimaFecha - DIAS_POR_PERIODO[periodo] * 24 * 60 * 60 * 1000;
    const filtrados = todosLosPuntos.filter((p) => new Date(p.fecha).getTime() >= desde);
    // si el periodo elegido deja muy pocos puntos (cuenta recien creada, poco
    // historial), se prefiere mostrar todo el historial disponible antes que
    // un grafico vacio o con un solo punto -- y se avisa, para que el boton
    // activo no pretenda mostrar un periodo que el grafico no muestra.
    return filtrados.length >= 2
      ? { puntos: filtrados, historialInsuficiente: false }
      : { puntos: todosLosPuntos, historialInsuficiente: true };
  }, [todosLosPuntos, periodo]);

  if (todosLosPuntos.length < 2) {
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-2 mb-2">
          <h2 className="text-small font-semibold text-fg">Evolución del portafolio</h2>
        </div>
        <p className="text-micro text-fg-muted py-8 text-center">
          Todavía no hay suficiente historial para graficar — vuelve cuando tengas al menos dos fechas
          con valores guardados.
        </p>
      </div>
    );
  }

  const gananciaEsPositivaHoy = puntos[puntos.length - 1].gananciaClp >= 0;
  const colorGanancia = gananciaEsPositivaHoy ? "var(--color-pos)" : "var(--color-neg)";
  const ejeX = calcularEjeX(puntos.map((p) => p.fecha));
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  // resumen para lectores de pantalla: el grafico en si es visual.
  const resumen = `Evolución del portafolio del ${formatoFecha(primero.fecha)} al ${formatoFecha(
    ultimo.fecha
  )}. Valor total: de ${formatoPesos(primero.totalClp)} a ${formatoPesos(ultimo.totalClp)}. Capital aportado: ${formatoPesos(
    ultimo.capitalAportadoClp
  )}. Ganancia real: ${formatoPesosSigned(ultimo.gananciaClp)}.`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-x-3 gap-y-2 mb-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-small font-semibold text-fg">Evolución del portafolio</h2>
          <Ayuda>
            El área gris es el capital que has aportado, acumulado (crece en escalones, cuando haces
            un aporte o retiro). El área verde o roja encima es tu ganancia o pérdida real sobre ese
            capital. La línea del valor total va sobre ambas.
          </Ayuda>
        </div>
        <div role="group" aria-label="Período del gráfico" className="flex gap-0.5 bg-white/[0.04] p-[3px] rounded-[10px]">
          {PERIODOS.map((p) => {
            const activo = p === periodo;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                aria-pressed={activo}
                className={`h-9 sm:h-8 min-w-11 px-3 rounded-lg text-small font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                  activo ? "bg-white/[0.12] text-fg shadow-[0_1px_2px_rgba(0,0,0,.3)]" : "text-fg-muted hover:text-fg"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      {historialInsuficiente && (
        <p className="mb-2 text-micro text-fg-muted" role="status">
          Aún no hay historial de {periodo}: se muestra todo lo disponible.
        </p>
      )}
      <p className="sr-only">{resumen}</p>
      <div className="h-[220px] sm:h-[300px]" role="img" aria-label={resumen}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={puntos} margin={{ top: 14, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${gradientId}-capital`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${gradientId}-ganancia`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorGanancia} stopOpacity={0.32} />
                <stop offset="100%" stopColor={colorGanancia} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal vertical={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              dataKey="fecha"
              ticks={ejeX.ticks}
              interval={0}
              padding={{ left: 16, right: 16 }}
              tickFormatter={ejeX.porDia ? formatoDia : formatoMes}
              tick={{ fontSize: 12, fill: "var(--color-fg-subtle)" }}
              axisLine={{ stroke: "rgba(255,255,255,.06)" }}
              tickLine={false}
            />
            <YAxis
              width={58}
              domain={["dataMin", "dataMax"]}
              tickCount={4}
              tickFormatter={formatoPesosCompacto}
              tick={{ fontSize: 12, fill: "var(--color-fg-subtle)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: "var(--accent)", strokeOpacity: 0.26 }} />
            <Area
              type="stepAfter"
              dataKey="capitalAportadoClp"
              stackId="portafolio"
              stroke="rgba(255,255,255,.28)"
              strokeWidth={1.4}
              fill={`url(#${gradientId}-capital)`}
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
              fill={`url(#${gradientId}-ganancia)`}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="totalClp"
              stroke="var(--accent)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4.5, fill: "var(--color-surface-raised)", stroke: "var(--accent)", strokeWidth: 2.4 }}
              isAnimationActive
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-x-4 gap-y-1.5 mt-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span aria-hidden="true" className="w-3 h-0.5 rounded-full bg-accent" />
          Valor total
        </span>
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.08] border border-white/[0.28]" />
          Capital aportado
        </span>
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "rgba(65,215,170, 0.3)" }} />
          Ganancia real
        </span>
      </div>
    </div>
  );
}
