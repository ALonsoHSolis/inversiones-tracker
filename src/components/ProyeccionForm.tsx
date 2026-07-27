"use client";

import { useState } from "react";
import { InputMonto } from "@/components/InputMonto";
import { calcularProyeccion, type EscenarioProyeccion } from "@/lib/proyeccion";
import { formatoPesos, formatoPesosSigned } from "@/lib/formato";

const inputClass =
  "h-11 px-3 rounded-[10px] border border-white/[0.14] text-right text-[14px] font-mono-tabular bg-white/[0.04] text-[#F2F5F9] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

const ESCENARIOS: { clave: keyof ReturnType<typeof calcularProyeccion>; etiqueta: string; color: string }[] = [
  { clave: "conservador", etiqueta: "Conservador", color: "#8892A0" },
  { clave: "base", etiqueta: "Base", color: "#F2F5F9" },
  { clave: "optimista", etiqueta: "Optimista", color: "var(--pos)" },
];

function TarjetaEscenario({ etiqueta, color, escenario }: { etiqueta: string; color: string; escenario: EscenarioProyeccion }) {
  return (
    <div className="border border-white/[0.07] rounded-xl px-[15px] py-[13px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color }}>
        {etiqueta} · {escenario.tasaAnual.toFixed(1)}% anual
      </p>
      <p className="font-mono-tabular mt-2 text-[18px] font-semibold text-[#F2F5F9]">
        {formatoPesos(Math.round(escenario.valorFinal))}
      </p>
      <p className="mt-1 text-[11.5px] text-[#8892A0]">
        aportado {formatoPesos(Math.round(escenario.totalAportado))} · ganancia{" "}
        <span style={{ color: escenario.gananciaProyectada >= 0 ? "var(--pos)" : "var(--neg)" }}>
          {formatoPesosSigned(Math.round(escenario.gananciaProyectada))}
        </span>
      </p>
    </div>
  );
}

// simulador de proyeccion a futuro -- distinto del calculo de rendimiento
// real de mas arriba en la pagina: aca no hay datos reales, es matematica
// hipotetica ("si aporto X y agrego Y cada mes a una tasa esperada Z%,
// cuanto tendria en N años"). los 3 escenarios usan la misma tasa base +-3
// puntos porcentuales -- simple y transparente en vez de una formula de
// "volatilidad esperada" que no podriamos justificar sin datos de mercado.
export function ProyeccionForm() {
  const [montoInicial, setMontoInicial] = useState("");
  const [aporteMensual, setAporteMensual] = useState("");
  const [horizonteAnios, setHorizonteAnios] = useState("10");
  const [tasaAnual, setTasaAnual] = useState("8");

  const mi = Number(montoInicial) || 0;
  const am = Number(aporteMensual) || 0;
  const horizonte = Number(horizonteAnios) || 0;
  const tasa = Number(tasaAnual) || 0;
  const hayDatos = (mi > 0 || am > 0) && horizonte > 0;

  const resultado = calcularProyeccion(mi, am, horizonte, tasa);

  return (
    <div className="bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-6 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#8892A0]">Aporte inicial</span>
          <InputMonto value={montoInicial} onChange={setMontoInicial} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#8892A0]">Aporte mensual</span>
          <InputMonto value={aporteMensual} onChange={setAporteMensual} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#8892A0]">Horizonte (años)</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={50}
            step={1}
            value={horizonteAnios}
            onChange={(e) => setHorizonteAnios(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#8892A0]">Tasa anual esperada (%)</span>
          <input
            type="number"
            inputMode="decimal"
            step={0.1}
            value={tasaAnual}
            onChange={(e) => setTasaAnual(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="h-px bg-white/[0.07] my-5" />

      {!hayDatos ? (
        <p className="text-[13px] text-[#8892A0] text-center py-2">
          Ingresa un aporte inicial o mensual, y un horizonte en años, para ver la proyección.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {ESCENARIOS.map(({ clave, etiqueta, color }) => (
              <TarjetaEscenario key={clave} etiqueta={etiqueta} color={color} escenario={resultado[clave]} />
            ))}
          </div>
          <p className="mt-4 text-[11.5px] text-[#5B6472] leading-relaxed">
            Conservador y optimista usan la tasa base ±3 puntos porcentuales. Esto es una proyección
            matemática, no una promesa de rendimiento — asume un aporte mensual constante durante
            todo el horizonte y una tasa fija, cosas que en la práctica varían.
          </p>
        </>
      )}
    </div>
  );
}
