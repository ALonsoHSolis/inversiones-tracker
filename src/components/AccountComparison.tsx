"use client";

import { useState } from "react";
import { Ayuda } from "@/components/Ayuda";
import { formatoPct } from "@/lib/formato";
import type { RachaResultado } from "@/lib/rendimiento";

export interface CuentaComparacion {
  id: string;
  nombre: string;
  rendimientoAnualizado: number | null;
  racha: RachaResultado;
  twr: number | null;
  xirr: number | null;
  gananciaClp: number | null;
}

interface AccountComparisonProps {
  cuentas: CuentaComparacion[];
  gananciaTotalClp: number;
  twrPortafolio: number | null;
  drawdownPortafolio: number | null;
  xirrPortafolio: number | null;
}

type Orden = "anualizado" | "contribucion";

function contribucionPct(gananciaClp: number | null, gananciaTotalClp: number): number | null {
  if (gananciaClp == null || gananciaTotalClp === 0) return null;
  return (gananciaClp / gananciaTotalClp) * 100;
}

// null siempre al final, sin importar el orden -- una cuenta sin dato
// suficiente (menos de un mes de antiguedad, o sin dos snapshots) no es "peor"
// que una con rendimiento negativo, simplemente no es comparable todavia.
function compararConNullAlFinal(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

function textoRacha(racha: RachaResultado): string {
  if (racha.tipo == null || racha.longitud === 0) return "sin racha";
  // racha.tipo es "positiva"/"negativa" (femenino); "registro" es masculino,
  // asi que se concuerda aca: antes salia "1 registro negativao seguido".
  const uno = racha.longitud === 1;
  const adjetivo = racha.tipo === "positiva" ? "positivo" : "negativo";
  return `${racha.longitud} ${uno ? "registro" : "registros"} ${adjetivo}${uno ? "" : "s"} seguido${uno ? "" : "s"}`;
}

export function AccountComparison({
  cuentas,
  gananciaTotalClp,
  twrPortafolio,
  drawdownPortafolio,
  xirrPortafolio,
}: AccountComparisonProps) {
  const [orden, setOrden] = useState<Orden>("anualizado");

  if (cuentas.length === 0) return null;

  const filas = [...cuentas].sort((a, b) => {
    if (orden === "anualizado") return compararConNullAlFinal(a.rendimientoAnualizado, b.rendimientoAnualizado);
    return compararConNullAlFinal(
      contribucionPct(a.gananciaClp, gananciaTotalClp),
      contribucionPct(b.gananciaClp, gananciaTotalClp)
    );
  });

  const color = (n: number | null) => (n == null ? "var(--color-fg-muted)" : n >= 0 ? "var(--color-pos)" : "var(--color-neg)");
  const pct = (n: number | null) => (n != null ? formatoPct(n) : "—");

  return (
    <section className="card p-5" aria-labelledby="comparacion-titulo">
      <div className="flex items-center gap-1 mb-0.5">
        <h2 id="comparacion-titulo" className="titulo-bloque">Rendimiento por cuenta</h2>
        <Ayuda etiqueta="Cómo leer TWR, XIRR y peor caída">
          El TWR (time-weighted return) encadena el rendimiento de cada período de tu portafolio
          completo, ya descontando aportes y retiros en cada uno — mide qué tan bien se desempeñó tu
          plata, sin importar cuánto le agregaste o sacaste en el camino. El máximo drawdown es la
          peor caída registrada desde un máximo hasta el mínimo posterior, calculada sobre esa misma
          serie (nunca sobre el valor bruto, para que un retiro no se vea como una caída de mercado).
          El XIRR es una tasa anualizada distinta al &quot;rendimiento anualizado&quot; que ya se
          muestra en el resto de la app — esta sí ajusta por la fecha exacta de cada aporte y retiro,
          en vez de solo mirar el capital acumulado. Es una métrica adicional, no un reemplazo.
          Los tres solo ven lo que capturaron tus propios registros — si el mercado cayó y se
          recuperó entre dos actualizaciones tuyas, no queda reflejado.
        </Ayuda>
      </div>
      <p className="text-micro text-fg-muted">Rendimiento compuesto del portafolio y comparación entre tus cuentas</p>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-[var(--color-edge)] rounded-xl bg-white/[0.025] py-3 shadow-[inset_0_0_0_1px_var(--color-edge)]">
        <div className="min-w-0 px-3 sm:px-4">
          <dt className="etiqueta">TWR</dt>
          <dd className="money-value mt-1 font-mono-tabular text-lg font-semibold" style={{ color: color(twrPortafolio) }}>
            {pct(twrPortafolio)}
          </dd>
        </div>
        <div className="min-w-0 px-3 sm:px-4">
          <dt className="etiqueta">XIRR anual</dt>
          <dd className="money-value mt-1 font-mono-tabular text-lg font-semibold" style={{ color: color(xirrPortafolio) }}>
            {pct(xirrPortafolio)}
          </dd>
        </div>
        <div className="min-w-0 px-3 sm:px-4">
          <dt className="etiqueta">Peor caída</dt>
          <dd
            className="money-value mt-1 font-mono-tabular text-lg font-semibold"
            style={{ color: drawdownPortafolio != null && drawdownPortafolio < 0 ? "var(--color-neg)" : "var(--color-fg)" }}
          >
            {drawdownPortafolio != null && drawdownPortafolio < 0 ? formatoPct(drawdownPortafolio) : "Sin caídas"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-small font-medium text-fg-soft">Por cuenta</p>
        <div role="group" aria-label="Ordenar cuentas por" className="segmentado">
          <button type="button" aria-pressed={orden === "anualizado"} onClick={() => setOrden("anualizado")}>
            Anualizado
          </button>
          <button type="button" aria-pressed={orden === "contribucion"} onClick={() => setOrden("contribucion")}>
            Contribución
          </button>
        </div>
      </div>

      {/* escritorio: tabla comparativa */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-small">
          <caption className="sr-only">Comparación de rendimiento entre cuentas</caption>
          <thead>
            <tr className="text-micro text-fg-muted">
              <th scope="col" className="py-2 pr-3 text-left font-semibold">Cuenta</th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">Anualizado</th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-semibold">Contribución</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">TWR</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">XIRR</th>
              <th scope="col" className="py-2 pl-3 text-left font-semibold">Racha</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((c) => {
              const contribucion = contribucionPct(c.gananciaClp, gananciaTotalClp);
              return (
                <tr key={c.id} className="border-t border-[var(--color-edge)]">
                  <th scope="row" className="py-3 pr-3 text-left font-semibold text-fg">{c.nombre}</th>
                  <td className="px-3 py-3 text-right font-mono-tabular font-semibold" style={{ color: color(c.rendimientoAnualizado) }}>
                    {pct(c.rendimientoAnualizado)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono-tabular text-fg-soft">{pct(contribucion)}</td>
                  <td className="px-3 py-3 text-right font-mono-tabular" style={{ color: color(c.twr) }}>{pct(c.twr)}</td>
                  <td className="px-3 py-3 text-right font-mono-tabular" style={{ color: color(c.xirr) }}>{pct(c.xirr)}</td>
                  <td className="py-3 pl-3 text-micro text-fg-muted">{textoRacha(c.racha)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* celular: filas */}
      <ul className="lista-filas md:hidden">
        {filas.map((c) => {
          const contribucion = contribucionPct(c.gananciaClp, gananciaTotalClp);
          return (
            <li key={c.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 break-words text-small font-semibold text-fg">{c.nombre}</span>
                <span className="shrink-0 text-right font-mono-tabular text-small font-semibold" style={{ color: color(c.rendimientoAnualizado) }}>
                  {pct(c.rendimientoAnualizado)}
                  <span className="ml-1 font-medium text-fg-subtle">anual</span>
                </span>
              </div>
              <p className="mt-1 text-micro leading-relaxed text-fg-muted">
                {contribucion != null ? `${formatoPct(contribucion)} del rendimiento total` : "Sin contribución medible"}
                {c.twr != null && (
                  <>
                    {" · "}TWR <span className="font-mono-tabular" style={{ color: color(c.twr) }}>{formatoPct(c.twr)}</span>
                  </>
                )}
                {c.xirr != null && (
                  <>
                    {" · "}XIRR <span className="font-mono-tabular" style={{ color: color(c.xirr) }}>{formatoPct(c.xirr)}</span>
                  </>
                )}
                {" · "}
                {textoRacha(c.racha)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
