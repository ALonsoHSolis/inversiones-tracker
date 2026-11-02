"use client";

import { useId, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Ayuda } from "@/components/Ayuda";
import { calcularEjeX } from "@/lib/graficos";
import { useReducedMotion } from "@/lib/useReducedMotion";
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
    <div className="min-w-[200px] rounded-xl bg-surface-raised px-3.5 py-3 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(148,170,200,0.16)]">
      <p className="mb-2 font-mono-tabular text-micro font-medium text-fg-soft">{formatoFecha(punto.fecha)}</p>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-[2px] bg-accent" />
        <span className="text-micro text-fg-muted">Valor total</span>
        <span className="font-mono-tabular text-micro font-semibold text-white ml-auto">
          {formatoPesos(punto.totalClp)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2.5 h-0 border-t-2 border-dashed border-white/[0.45]" />
        <span className="text-micro text-fg-muted">Capital</span>
        <span className="font-mono-tabular text-micro font-semibold text-white ml-auto">
          {formatoPesos(punto.capitalAportadoClp)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-[2px]" style={{ background: esPositivo ? "var(--pos)" : "var(--neg)" }} />
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
  const sinMovimiento = useReducedMotion();

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
          <h2 className="titulo-bloque">Evolución del portafolio</h2>
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
        <div className="flex items-center gap-1">
          <h2 className="titulo-bloque">Evolución del portafolio</h2>
          <Ayuda>
            La línea punteada es el capital que has aportado, acumulado: crece en escalones cuando haces
            un aporte o retiro. El área verde o roja encima es tu ganancia o pérdida real sobre ese
            capital. La línea champán es el valor total. No se suavizan los datos: cada escalón es un
            registro real.
          </Ayuda>
        </div>
        <div role="group" aria-label="Período del gráfico" className="segmentado">
          {PERIODOS.map((p) => {
            const activo = p === periodo;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                aria-pressed={activo}
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
      <div className="h-[230px] sm:h-[320px] -mx-1" role="img" aria-label={resumen}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={puntos} margin={{ top: 14, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${gradientId}-capital`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9fb0c8" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#9fb0c8" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id={`${gradientId}-ganancia`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorGanancia} stopOpacity={0.22} />
                <stop offset="100%" stopColor={colorGanancia} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal vertical={false} stroke="rgba(148,170,200,.08)" strokeDasharray="2 4" />
            <XAxis
              dataKey="fecha"
              ticks={ejeX.ticks}
              interval={0}
              padding={{ left: 16, right: 16 }}
              tickFormatter={ejeX.porDia ? formatoDia : formatoMes}
              tick={{ fontSize: 12, fill: "var(--color-fg-subtle)" }}
              axisLine={false}
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
            <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: "rgba(234,211,162,.45)", strokeWidth: 1 }} />
            <Area
              type="stepAfter"
              dataKey="capitalAportadoClp"
              stackId="portafolio"
              stroke="rgba(211,218,230,.5)"
              strokeWidth={1.3}
              strokeDasharray="4 4"
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
              isAnimationActive={!sinMovimiento}
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-x-5 gap-y-1.5 mt-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span aria-hidden="true" className="w-3 h-0.5 rounded-full bg-accent" />
          Valor total
        </span>
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span aria-hidden="true" className="w-3 h-0 border-t-2 border-dashed border-white/[0.5]" />
          Capital aportado
        </span>
        <span className="inline-flex items-center gap-1.5 text-micro font-medium text-fg-muted">
          <span aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px]" style={{ background: colorGanancia, opacity: 0.45 }} />
          {gananciaEsPositivaHoy ? "Ganancia real" : "Pérdida real"}
        </span>
      </div>
    </div>
  );
}
