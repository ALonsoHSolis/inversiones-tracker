"use client";

import { useState } from "react";
import Link from "next/link";
import { InputMonto } from "@/components/InputMonto";
import { calcularRendimiento } from "@/lib/rendimiento";
import { formatoPesos, formatoPesosSigned, formatoPct } from "@/lib/formato";
import type { TipoMovimiento } from "@/types/database";

const inputClass =
  "h-11 px-3 rounded-[10px] border border-white/[0.14] text-right text-[14px] font-mono-tabular bg-white/[0.04] text-fg focus:outline-none focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30";

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
    <div className="card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-micro font-semibold text-fg-muted">Valor inicial</span>
          <InputMonto value={valorInicial} onChange={setValorInicial} placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-micro font-semibold text-fg-muted">Valor final</span>
          <InputMonto value={valorFinal} onChange={setValorFinal} placeholder="0" className={inputClass} />
        </label>
      </div>

      <div className="flex flex-col gap-1 mt-3">
        <span className="text-micro font-semibold text-fg-muted">Aportes / retiros</span>
        <div className="flex flex-wrap gap-1.5">
          <div className="flex rounded-[10px] border border-white/[0.14] overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setTipoMovimiento("aporte")}
              className={`h-11 px-3 text-micro font-semibold ${
                tipoMovimiento === "aporte" ? "bg-[var(--accent)] text-ink" : "bg-transparent text-fg-muted"
              }`}
            >
              Aporté
            </button>
            <button
              type="button"
              onClick={() => setTipoMovimiento("retiro")}
              className={`h-11 px-3 text-micro font-semibold border-l border-white/[0.14] ${
                tipoMovimiento === "retiro" ? "bg-[var(--accent)] text-ink" : "bg-transparent text-fg-muted"
              }`}
            >
              Retiré
            </button>
          </div>
          <InputMonto
            value={montoMovimiento}
            onChange={setMontoMovimiento}
            placeholder="0"
            className={`${inputClass} flex-1 min-w-[140px]`}
          />
        </div>
      </div>

      <div className="h-px bg-white/[0.07] my-5" />

      {!hayDatos ? (
        <p className="text-small text-fg-muted text-center py-2">
          Ingresa el valor inicial y el valor final para ver tu rendimiento real.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-micro uppercase tracking-[0.08em] font-semibold text-fg-subtle">
                Cuánto subió tu cuenta
              </p>
              <p className="font-mono-tabular mt-1 text-[22px] font-semibold text-fg">
                {formatoPesosSigned(cambioNominal)}
              </p>
              {aportesNetos !== 0 && (
                <p className="mt-1 text-micro text-fg-muted">
                  de los cuales {formatoPesosSigned(aportesNetos)} fue aporte/retiro, no ganancia
                </p>
              )}
            </div>
            <div>
              <p className="text-micro uppercase tracking-[0.08em] font-semibold text-fg-subtle">
                Tu ganancia real
              </p>
              <p
                className="font-mono-tabular mt-1 text-[22px] font-semibold"
                style={{ color: gananciaReal >= 0 ? "var(--pos)" : "var(--neg)" }}
              >
                {formatoPesosSigned(gananciaReal)}
              </p>
              {rendimientoPct !== null && (
                <p className="mt-1 text-micro text-fg-muted font-mono-tabular">
                  {formatoPct(rendimientoPct)} sobre tu capital
                </p>
              )}
            </div>
          </div>

          {aportesNetos !== 0 && (
            <p className="mt-4 text-micro text-fg-muted font-mono-tabular">
              {formatoPesos(vf)} (valor final) − {formatoPesos(vi)} (valor inicial) −{" "}
              {formatoPesosSigned(aportesNetos)} ({tipoMovimiento === "aporte" ? "aporte" : "retiro"}) ={" "}
              {formatoPesosSigned(gananciaReal)}
            </p>
          )}
        </>
      )}

      <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center justify-between gap-4 flex-wrap">
        <p className="text-small text-fg-muted">Haz esto automático con todas tus cuentas.</p>
        <Link
          href="/signup"
          className="inline-flex items-center h-10 px-5 rounded-[9px] bg-[var(--accent)] text-ink text-small font-semibold no-underline whitespace-nowrap"
        >
          Crear cuenta gratis →
        </Link>
      </div>
    </div>
  );
}
