"use client";

import { useId, useState } from "react";
import { calcularRendimiento } from "@/lib/rendimiento";
import { formatoMiles, formatoPct, formatoPesosSigned, normalizarMontoIngresado, montoParaEditar } from "@/lib/formato";

// la prueba del producto en la landing: el visitante escribe cuanto tenia,
// cuanto tiene hoy y cuanto deposito, y ve la ganancia "aparente" (lo que
// sugiere mirar solo el saldo) contra la ganancia real. usa
// calcularRendimiento de src/lib/rendimiento.ts, la misma formula (con tests)
// de la calculadora publica y de la vista rendimiento_semanal.

const ESCENARIOS = [
  { etiqueta: "Deposité un millón", antes: "10000000", hoy: "11000000", aporte: "1000000" },
  { etiqueta: "El mercado subió", antes: "10000000", hoy: "10400000", aporte: "0" },
  { etiqueta: "Deposité y el mercado bajó", antes: "10000000", hoy: "10700000", aporte: "1000000" },
];

function Campo({ id, etiqueta, valor, alCambiar }: { id: string; etiqueta: string; valor: string; alCambiar: (v: string) => void }) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <label htmlFor={id} className="calculo-campo">
      <span className="text-small font-medium text-fg-muted">{etiqueta}</span>
      <span className="flex items-baseline gap-1">
        <span aria-hidden="true" className="text-fg-muted">$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={enfocado ? montoParaEditar(valor) : formatoMiles(valor)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          onChange={(e) => alCambiar(normalizarMontoIngresado(e.target.value))}
          className="w-full min-w-0 bg-transparent font-mono-tabular text-fg outline-none"
        />
      </span>
    </label>
  );
}

export function CalculoVivo() {
  const id = useId();
  const [antes, setAntes] = useState(ESCENARIOS[0].antes);
  const [hoy, setHoy] = useState(ESCENARIOS[0].hoy);
  const [aporte, setAporte] = useState(ESCENARIOS[0].aporte);

  const vAntes = Number(antes) || 0;
  const vHoy = Number(hoy) || 0;
  const vAporte = Number(aporte) || 0;
  const aparente = vHoy - vAntes;
  const aparentePct = vAntes > 0 ? (aparente / vAntes) * 100 : null;
  const real = calcularRendimiento(vAntes, vHoy, vAporte > 0 ? [{ tipo: "aporte", monto: vAporte }] : []);
  const colorReal = real.gananciaReal >= 0 ? "var(--color-pos)" : "var(--color-neg)";
  // sin valor anterior no hay nada que comparar: no se muestra ninguna cifra
  // (antes, con el campo vacio, salia "+1.000 % de ganancia real" en verde)
  const faltaAnterior = vAntes <= 0;
  const aporteMayorQueHoy = vAporte > 0 && vAporte > vHoy;
  const escenarioActivo = ESCENARIOS.find((e) => e.antes === antes && e.hoy === hoy && e.aporte === aporte)?.etiqueta;

  return (
    <div data-ui className="calculo-vivo">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo id={`${id}-antes`} etiqueta="Valor la semana pasada" valor={antes} alCambiar={setAntes} />
        <Campo id={`${id}-hoy`} etiqueta="Valor hoy" valor={hoy} alCambiar={setHoy} />
        <Campo id={`${id}-aporte`} etiqueta="Lo que depositaste" valor={aporte} alCambiar={setAporte} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div className="rounded-2xl bg-white/[0.03] p-5">
          <p className="text-small font-medium text-fg-muted">Mirando solo el saldo</p>
          <p className="mt-2 font-mono-tabular text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-none tracking-[-0.03em] text-fg-soft">
            {faltaAnterior ? "—" : formatoPesosSigned(aparente)}
          </p>
          <p className="mt-2 text-small text-fg-muted">
            {faltaAnterior || aparentePct == null
              ? "Escribe el valor de la semana pasada"
              : `${formatoPct(aparentePct)} que ${aparente >= 0 ? "parece ganancia" : "parece pérdida"}`}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-raised p-5">
          <p className="text-small font-medium text-accent-hi">Con Mi portafolio</p>
          <p
            className="mt-2 font-mono-tabular text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-none tracking-[-0.03em]"
            style={{ color: faltaAnterior ? "var(--color-fg-muted)" : colorReal }}
          >
            {faltaAnterior ? "—" : formatoPesosSigned(real.gananciaReal)}
          </p>
          <p className="mt-2 text-small text-fg-soft">
            {faltaAnterior || real.rendimientoPct == null
              ? "Necesitamos el valor de la semana pasada para comparar"
              : `${formatoPct(real.rendimientoPct)} de ${real.gananciaReal >= 0 ? "ganancia" : "pérdida"} real`}
            {!faltaAnterior && vAporte > 0 && " · tu depósito no cuenta como ganancia"}
          </p>
          {aporteMayorQueHoy && (
            <p className="mt-2 text-small text-warn">
              El depósito supera el valor de hoy: revisa los montos.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Probar con un ejemplo">
        {ESCENARIOS.map((e) => (
          <button
            key={e.etiqueta}
            type="button"
            aria-pressed={escenarioActivo === e.etiqueta}
            onClick={() => {
              setAntes(e.antes);
              setHoy(e.hoy);
              setAporte(e.aporte);
            }}
            className={`boton-secundario rounded-full ${escenarioActivo === e.etiqueta ? "!bg-surface-raised !text-fg shadow-[inset_0_0_0_1px_var(--color-accent)]" : ""}`}
          >
            {e.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
