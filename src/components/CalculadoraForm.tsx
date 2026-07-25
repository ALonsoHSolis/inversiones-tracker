"use client";

import { useState } from "react";
import Link from "next/link";
import { InputMonto } from "@/components/InputMonto";
import { calcularRendimiento } from "@/lib/rendimiento";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";
import type { TipoMovimiento } from "@/types/database";

const inputClass =
  "h-11 px-3 rounded-[10px] border border-[#DFE2E8] text-right text-[14px] font-mono-tabular bg-white focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

export function CalculadoraForm() {
  const [valorInicial, setValorInicial] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("aporte");
  const [montoMovimiento, setMontoMovimiento] = useState("");

  const vi = Number(valorInicial) || 0;
  const vf = Number(valorFinal) || 0;
  const monto = Number(montoMovimiento) || 0;
  const movimientos = monto > 0 ? [{ tipo: tipoMovimiento, monto }] : [];

  const hayDatos = vi > 0 && vf > 0;
  const { gananciaReal, aportesNetos, rendimientoPct } = calcularRendimiento(vi, vf, movimientos);
  const cambioNominal = vf - vi;

  return (
    <div className="bg-white border border-[#E7E9EE] rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,30,50,0.03)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#6B7280]">Valor inicial</span>
          <InputMonto value={valorInicial} onChange={setValorInicial} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#6B7280]">Valor final</span>
          <InputMonto value={valorFinal} onChange={setValorFinal} placeholder="0" className={inputClass} />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#6B7280]">Aportes / retiros</span>
          <div className="flex gap-1.5">
            <div className="flex rounded-[10px] border border-[#DFE2E8] overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setTipoMovimiento("aporte")}
                className={`h-11 px-2.5 text-[12.5px] font-semibold ${
                  tipoMovimiento === "aporte" ? "bg-[var(--accent)] text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                Aporté
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimiento("retiro")}
                className={`h-11 px-2.5 text-[12.5px] font-semibold border-l border-[#DFE2E8] ${
                  tipoMovimiento === "retiro" ? "bg-[var(--accent)] text-white" : "bg-white text-[#6B7280]"
                }`}
              >
                Retiré
              </button>
            </div>
            <InputMonto
              value={montoMovimiento}
              onChange={setMontoMovimiento}
              placeholder="0"
              className={`${inputClass} flex-1 min-w-0`}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-[#EEF0F4] my-5" />

      {!hayDatos ? (
        <p className="text-[13px] text-[#8A929E] text-center py-2">
          Ingresa el valor inicial y el valor final para ver tu rendimiento real.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A929E]">
                Cuánto subió tu cuenta
              </p>
              <p className="font-mono-tabular mt-1 text-[22px] font-semibold text-[#171A20]">
                {formatoPesosSigned(cambioNominal)}
              </p>
              {aportesNetos !== 0 && (
                <p className="mt-1 text-[12px] text-[#8A929E]">
                  de los cuales {formatoPesosSigned(aportesNetos)} fue aporte/retiro, no ganancia
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8A929E]">
                Tu ganancia real
              </p>
              <p
                className="font-mono-tabular mt-1 text-[22px] font-semibold"
                style={{ color: gananciaReal >= 0 ? "var(--pos)" : "var(--neg)" }}
              >
                {formatoPesosSigned(gananciaReal)}
              </p>
              {rendimientoPct !== null && (
                <p className="mt-1 text-[12px] text-[#8A929E] font-mono-tabular">
                  {formatoPct(rendimientoPct)} sobre tu capital
                </p>
              )}
            </div>
          </div>

          {aportesNetos !== 0 && (
            <p className="mt-4 text-[12.5px] text-[#8A929E] font-mono-tabular">
              {formatoPesos(vf)} (valor final) − {formatoPesos(vi)} (valor inicial) −{" "}
              {formatoPesosSigned(aportesNetos)} ({tipoMovimiento === "aporte" ? "aporte" : "retiro"}) ={" "}
              {formatoPesosSigned(gananciaReal)}
            </p>
          )}
        </>
      )}

      <div className="mt-6 pt-5 border-t border-[#E7E9EE] flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-[#40474F]">Haz esto automático con todas tus cuentas.</p>
        <Link
          href="/signup"
          className="inline-flex items-center h-10 px-5 rounded-[9px] bg-[var(--accent)] text-white text-[13.5px] font-semibold no-underline whitespace-nowrap"
        >
          Crear cuenta gratis →
        </Link>
      </div>
    </div>
  );
}
