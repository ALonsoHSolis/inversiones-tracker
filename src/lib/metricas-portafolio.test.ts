import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMetricasPortafolio } from "./metricas-portafolio.ts";

const cuentas = [
  { id: "a", moneda: "CLP" },
  { id: "b", moneda: "USD" },
];

test("un aporte a mitad de camino no cuenta como rendimiento en el TWR", () => {
  // 100 -> 110 (+10%), luego aporte de 50 y valor 160 (0% real) => TWR = +10%
  const m = calcularMetricasPortafolio({
    evolucion: [
      { valor_total_clp: 100, capital_aportado_acumulado_clp: 100 },
      { valor_total_clp: 110, capital_aportado_acumulado_clp: 100 },
      { valor_total_clp: 160, capital_aportado_acumulado_clp: 150 },
    ],
    movimientos: [],
    cuentas,
    valorActualClp: 160,
    hoy: "2026-01-10",
  });
  assert.ok(m.twr !== null && Math.abs(m.twr - 10) < 1e-9);
});

test("sin historial ni flujos, todo es null", () => {
  const m = calcularMetricasPortafolio({ evolucion: [], movimientos: [], cuentas, valorActualClp: 0, hoy: "2026-01-10" });
  assert.deepEqual(m, { twr: null, drawdown: null, xirr: null });
});

test("xirr convierte aportes USD con la tasa del movimiento y ignora cuentas inactivas", () => {
  // aporte USD 100 a 900 => 90.000 clp el 2025-01-01; valor hoy 99.000 un año despues => ~10%
  const m = calcularMetricasPortafolio({
    evolucion: [],
    movimientos: [
      { cuenta_id: "b", fecha: "2025-01-01", tipo: "aporte", monto: 100, tasa_cambio: 900 },
      { cuenta_id: "zzz", fecha: "2025-01-01", tipo: "aporte", monto: 1_000_000, tasa_cambio: null },
    ],
    cuentas,
    valorActualClp: 99_000,
    hoy: "2026-01-01",
  });
  assert.ok(m.xirr !== null && Math.abs(m.xirr - 10) < 0.01);
});
