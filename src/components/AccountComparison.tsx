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
  const plural = racha.longitud === 1 ? "registro" : "registros";
  return `${racha.longitud} ${plural} ${racha.tipo}${racha.longitud === 1 ? "o" : "s"} seguido${racha.longitud === 1 ? "" : "s"}`;
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

  return (
    <section className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13.5px] font-semibold text-[#F2F5F9]">Análisis de rendimiento</p>
        <Ayuda>
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
      <p className="text-[11.5px] text-[#8892A0] mb-4">Rendimiento compuesto y comparación entre tus cuentas</p>

      <div className="grid grid-cols-3 gap-3.5">
        <div>
          <p className="text-[11px] font-medium text-[#8892A0]">TWR del portafolio</p>
          <p
            className="money-value mt-1 font-mono-tabular font-semibold text-base"
            style={{ color: twrPortafolio == null ? "#F2F5F9" : twrPortafolio >= 0 ? "var(--pos)" : "var(--neg)" }}
          >
            {twrPortafolio != null ? formatoPct(twrPortafolio) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#8892A0]">Peor caída registrada</p>
          <p className="money-value mt-1 font-mono-tabular font-semibold text-base" style={{ color: "var(--neg)" }}>
            {drawdownPortafolio != null && drawdownPortafolio < 0 ? formatoPct(drawdownPortafolio) : "sin caídas"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#8892A0]">XIRR del portafolio</p>
          <p
            className="money-value mt-1 font-mono-tabular font-semibold text-base"
            style={{ color: xirrPortafolio == null ? "#F2F5F9" : xirrPortafolio >= 0 ? "var(--pos)" : "var(--neg)" }}
          >
            {xirrPortafolio != null ? formatoPct(xirrPortafolio) : "—"}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.07] my-4" />

      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11.5px] text-[#8892A0]">Por cuenta</p>
        <div className="flex gap-0.5 bg-white/[0.04] p-[3px] rounded-[9px]">
          <button
            type="button"
            onClick={() => setOrden("anualizado")}
            className="h-6 px-2.5 rounded-md text-xs font-semibold"
            style={{
              background: orden === "anualizado" ? "rgba(255,255,255,.1)" : "transparent",
              color: orden === "anualizado" ? "#F2F5F9" : "#7C8798",
            }}
          >
            Anualizado
          </button>
          <button
            type="button"
            onClick={() => setOrden("contribucion")}
            className="h-6 px-2.5 rounded-md text-xs font-semibold"
            style={{
              background: orden === "contribucion" ? "rgba(255,255,255,.1)" : "transparent",
              color: orden === "contribucion" ? "#F2F5F9" : "#7C8798",
            }}
          >
            Contribución
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[9px]">
        {filas.map((c) => {
          const contribucion = contribucionPct(c.gananciaClp, gananciaTotalClp);
          return (
            <div key={c.id} className="border border-white/[0.07] rounded-xl px-[15px] py-[13px]">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-[#F2F5F9]">{c.nombre}</span>
                <div className="text-right whitespace-nowrap">
                  <p
                    className="font-mono-tabular text-[13.5px] font-semibold"
                    style={{
                      color:
                        c.rendimientoAnualizado == null
                          ? "#8892A0"
                          : c.rendimientoAnualizado >= 0
                            ? "var(--pos)"
                            : "var(--neg)",
                    }}
                  >
                    {c.rendimientoAnualizado != null ? formatoPct(c.rendimientoAnualizado) : "—"}{" "}
                    <span className="text-[#5B6472] font-medium">anualizado</span>
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] text-[#8892A0]">
                {contribucion != null ? `${formatoPct(contribucion)} del rendimiento total` : "sin contribución medible"}
                {" · "}
                {textoRacha(c.racha)}
                {c.twr != null && (
                  <>
                    {" · "}
                    TWR{" "}
                    <span style={{ color: c.twr >= 0 ? "var(--pos)" : "var(--neg)" }}>{formatoPct(c.twr)}</span>
                  </>
                )}
                {c.xirr != null && (
                  <>
                    {" · "}
                    XIRR{" "}
                    <span style={{ color: c.xirr >= 0 ? "var(--pos)" : "var(--neg)" }}>{formatoPct(c.xirr)}</span>
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
