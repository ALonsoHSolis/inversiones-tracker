"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Ayuda } from "@/components/Ayuda";
import { CountUp } from "@/components/CountUp";
import { formatoFecha, formatoPct, formatoPesos, formatoPesosSigned } from "@/lib/formato";
import {
  ALTO,
  ANCHO,
  aportesPorFecha,
  construirGeometria,
  filtrarPeriodo,
  indiceMasCercano,
  PERIODOS,
  type Periodo,
  type PuntoPatrimonio,
} from "@/lib/grafico-patrimonio";

interface PatrimonioHeroProps {
  puntos: PuntoPatrimonio[];
  // valores de HOY tal como los calcula la pagina (rendimiento_actual /
  // capital_por_cuenta): se muestran cuando no se esta recorriendo el grafico.
  valorTotal: number;
  capitalAportadoClp: number;
  valorActualClp: number;
  sinCuentas: boolean;
  // fila de datos de contexto bajo el grafico (capital, cambio nominal, etc.)
  pie: ReactNode;
  // clave de sessionStorage del conteo inicial (la landing usa otra para no
  // consumir la animacion del inicio real)
  claveSesion?: string;
  // texto de la etiqueta cuando no se recorre el grafico
  etiqueta?: string;
}

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { month: "short", year: "numeric", timeZone: "UTC" }).replace(".", "");

// hero del inicio, al estilo de las apps de inversion: la cifra del
// patrimonio y su grafico son la pantalla, sin tarjeta alrededor. al
// recorrer el grafico (mouse, dedo o flechas del teclado) la cifra grande y
// la ganancia real muestran ese dia. la ganancia de un punto es total menos
// capital aportado acumulado, ambas columnas de evolucion_portafolio (la
// misma resta que ya hacia el tooltip del grafico anterior).
export function PatrimonioHero({
  puntos: todos,
  valorTotal,
  capitalAportadoClp,
  valorActualClp,
  sinCuentas,
  pie,
  claveSesion = "valor-total",
  etiqueta = "Patrimonio total",
}: PatrimonioHeroProps) {
  const [periodo, setPeriodo] = useState<Periodo>("6M");
  const [indice, setIndice] = useState<number | null>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const idGradiente = useId();

  const { puntos, insuficiente } = useMemo(() => filtrarPeriodo(todos, periodo), [todos, periodo]);
  const geo = useMemo(() => construirGeometria(puntos), [puntos]);
  // aportes calculados sobre TODA la serie (asi el primer punto de un
  // periodo tambien sabe si tuvo un aporte respecto del registro anterior)
  const aportes = useMemo(() => aportesPorFecha(todos), [todos]);

  const activo = indice != null && geo ? puntos[indice] : null;
  const total = activo ? activo.totalClp : valorTotal;
  const capital = activo ? activo.capitalClp : capitalAportadoClp;
  const ganancia = activo ? activo.totalClp - activo.capitalClp : valorActualClp - capitalAportadoClp;
  const gananciaPct = capital > 0 ? (ganancia / capital) * 100 : null;
  const positiva = ganancia >= 0;
  const color = positiva ? "var(--color-pos)" : "var(--color-neg)";
  const Icono = positiva ? TrendingUp : TrendingDown;

  function desdePuntero(e: PointerEvent<HTMLDivElement>) {
    if (!geo || !lienzo.current) return;
    const r = lienzo.current.getBoundingClientRect();
    setIndice(indiceMasCercano(geo.xs, (e.clientX - r.left) / r.width));
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    if (!geo) return;
    const ultimo = puntos.length - 1;
    const actual = indice ?? ultimo;
    const mapa: Record<string, number> = {
      ArrowLeft: Math.max(0, actual - 1),
      ArrowRight: Math.min(ultimo, actual + 1),
      Home: 0,
      End: ultimo,
    };
    if (e.key === "Escape") {
      setIndice(null);
      return;
    }
    if (e.key in mapa) {
      e.preventDefault();
      setIndice(mapa[e.key]);
    }
  }

  const xPct = activo && geo ? (geo.xs[indice!] / ANCHO) * 100 : null;
  const yPct = activo && geo ? (geo.ysTotal[indice!] / ALTO) * 100 : null;
  const ultimoX = geo ? (geo.xs[geo.xs.length - 1] / ANCHO) * 100 : 0;
  const ultimoY = geo ? (geo.ysTotal[geo.ysTotal.length - 1] / ALTO) * 100 : 0;

  const aporteActivo = activo ? aportes.get(activo.fecha) ?? 0 : 0;

  const textoPunto = activo
    ? `${formatoFecha(activo.fecha)}: patrimonio ${formatoPesos(activo.totalClp)}, ganancia real ${formatoPesosSigned(
        activo.totalClp - activo.capitalClp
      )}${aporteActivo !== 0 ? `; incluye ${aporteActivo > 0 ? "un aporte" : "un retiro"} de ${formatoPesos(Math.abs(aporteActivo))}` : ""}`
    : "Hoy";

  return (
    <section aria-label="Patrimonio" className="hero-patrimonio relative -mx-4 px-4 pt-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <p className="text-small font-medium text-fg-muted" aria-live="off">
        {activo ? fechaLarga(activo.fecha) : etiqueta}
      </p>

      <p className="money-value mt-1.5 flex items-start font-mono-tabular text-fg">
        <span className="mt-[0.18em] mr-1 text-[0.5em] font-medium text-fg-muted cifra-hero-simbolo">$</span>
        <span className={`cifra-hero ${Math.round(total).toLocaleString("es-CL").length > 11 ? "cifra-hero-larga" : ""}`}>
          {activo ? Math.round(total).toLocaleString("es-CL") : <CountUp valor={total} formato="numero" claveSesion={claveSesion} />}
        </span>
      </p>

      {!sinCuentas && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-mono-tabular text-lg font-semibold" style={{ color }}>
            <Icono size={18} strokeWidth={2.2} aria-hidden="true" />
            <span className="money-value">{formatoPesosSigned(ganancia)}</span>
            {gananciaPct != null && <span className="font-medium opacity-90">({formatoPct(gananciaPct)})</span>}
          </span>
          <span className="text-[15px] text-fg-muted">ganancia real{activo ? " a esa fecha" : ""}</span>
          <Ayuda etiqueta="Cómo se calcula la ganancia real">
            Es el valor de tus cuentas menos el capital que aportaste (depósitos menos retiros), todo en pesos con la
            tasa de cada registro. Un depósito nunca cuenta como ganancia. Al recorrer el gráfico se muestra la
            ganancia acumulada hasta ese día.
          </Ayuda>
        </div>
      )}

      {!sinCuentas && (
        <p className="mt-1.5 min-h-[1.5em] text-small text-fg-muted" aria-hidden="true">
          {aporteActivo !== 0 && (
            <>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent align-middle" />
              Este registro incluye {aporteActivo > 0 ? "un aporte" : "un retiro"} de{" "}
              <span className="money-value font-mono-tabular text-fg-soft">{formatoPesos(Math.abs(aporteActivo))}</span>,
              que no cuenta como {aporteActivo > 0 ? "ganancia" : "pérdida"}.
            </>
          )}
        </p>
      )}

      {sinCuentas ? (
        <p className="mt-4 max-w-[460px] text-small leading-relaxed text-fg-muted">
          Agrega tu primera cuenta para empezar a medir tu ganancia real, siempre separada de lo que depositas.
        </p>
      ) : !geo ? (
        <p className="mt-8 rounded-2xl bg-white/[0.025] px-5 py-10 text-center text-small text-fg-muted">
          Cuando tengas registros en al menos dos fechas, aquí verás la evolución de tu patrimonio.
        </p>
      ) : (
        <div className="mt-6">
          <div
            ref={lienzo}
            role="slider"
            tabIndex={0}
            aria-label="Recorrer la evolución del patrimonio. Usa las flechas izquierda y derecha."
            aria-valuemin={0}
            aria-valuemax={puntos.length - 1}
            aria-valuenow={indice ?? puntos.length - 1}
            aria-valuetext={
              activo
                ? textoPunto
                : `Hoy: patrimonio ${formatoPesos(valorTotal)}, ganancia real ${formatoPesosSigned(ganancia)}`
            }
            onPointerMove={desdePuntero}
            onPointerDown={desdePuntero}
            onPointerLeave={(e) => e.pointerType === "mouse" && setIndice(null)}
            onPointerUp={(e) => e.pointerType !== "mouse" && setIndice(null)}
            onPointerCancel={() => setIndice(null)}
            onKeyDown={teclado}
            onBlur={() => setIndice(null)}
            className="grafico-patrimonio relative h-[220px] cursor-crosshair touch-pan-y select-none rounded-xl outline-none sm:h-[300px] lg:h-[340px] focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
          >
            <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id={`${idGradiente}-area`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0bc78" stopOpacity="0.24" />
                  <stop offset="70%" stopColor="#e0bc78" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#e0bc78" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1="0" x2={ANCHO} y1={ALTO * f} y2={ALTO * f} stroke="rgba(148,170,200,0.07)" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
              ))}
              <path d={geo.area} fill={`url(#${idGradiente}-area)`} />
              <path d={geo.capital} fill="none" stroke="rgba(211,218,230,0.42)" strokeWidth="1.25" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              <path
                key={periodo}
                d={geo.linea}
                pathLength={1}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="linea-patrimonio"
              />
            </svg>

            {/* aportes y retiros: un punto sobre el escalon del capital */}
            {puntos.map((p, i) =>
              aportes.has(p.fecha) && i > 0 ? (
                <span
                  key={p.fecha}
                  aria-hidden="true"
                  className={`pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ink ${
                    (aportes.get(p.fecha) ?? 0) > 0 ? "bg-accent-hi" : "bg-fg-muted"
                  }`}
                  style={{ left: `${(geo.xs[i] / ANCHO) * 100}%`, top: `${(geo.ysCapital[i] / ALTO) * 100}%` }}
                />
              ) : null
            )}

            {/* marcador del punto recorrido (html: un circulo en svg con
                preserveAspectRatio="none" saldria ovalado) */}
            {xPct != null && yPct != null ? (
              <>
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-accent-hi/35" style={{ left: `${xPct}%` }} />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-ink shadow-[0_0_0_4px_rgba(224,188,120,0.18)]"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                />
              </>
            ) : (
              <span
                aria-hidden="true"
                className="punto-vivo pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                style={{ left: `${ultimoX}%`, top: `${ultimoY}%` }}
              />
            )}
          </div>

          <div className="mt-2 flex justify-between font-mono-tabular text-micro text-fg-subtle" aria-hidden="true">
            <span>{fechaCorta(puntos[0].fecha)}</span>
            <span>{fechaCorta(puntos[puntos.length - 1].fecha)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div role="group" aria-label="Período del gráfico" className="periodos flex gap-1">
              {PERIODOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={p === periodo}
                  onClick={() => {
                    setPeriodo(p);
                    setIndice(null);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-3.5 rounded-full bg-accent" />
                Patrimonio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="w-3.5 border-t-2 border-dashed border-white/45" />
                Capital aportado
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-hi" />
                Aporte o retiro
              </span>
            </div>
          </div>
          {insuficiente && (
            <p role="status" className="mt-2 text-micro text-fg-muted">
              Aún no hay historial de {periodo}: se muestra todo lo disponible.
            </p>
          )}
        </div>
      )}

      {pie && <div className="mt-6">{pie}</div>}
    </section>
  );
}
