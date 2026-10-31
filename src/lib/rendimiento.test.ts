import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularEfectoTipoCambio,
  calcularMaxDrawdown,
  calcularRacha,
  calcularRendimiento,
  calcularRendimientoAnualizado,
  calcularRetornosPortafolio,
  calcularTWR,
  calcularXIRR,
} from "./rendimiento.ts";

const casi = (real: number | null, esperado: number, tolerancia = 1e-6) => {
  assert.notEqual(real, null);
  assert.ok(Math.abs((real as number) - esperado) < tolerancia, `${real} no esta cerca de ${esperado}`);
};

// --- regla de negocio central: un aporte no es ganancia ---

test("un aporte no cuenta como ganancia (ejemplo de PROYECTO.md)", () => {
  const r = calcularRendimiento(1_000_000, 1_500_000, [{ tipo: "aporte", monto: 400_000 }]);
  assert.equal(r.aportesNetos, 400_000);
  assert.equal(r.gananciaReal, 100_000);
  casi(r.rendimientoPct, (100_000 / 1_400_000) * 100);
});

test("un retiro no cuenta como perdida", () => {
  const r = calcularRendimiento(1_000_000, 700_000, [{ tipo: "retiro", monto: 300_000 }]);
  assert.equal(r.aportesNetos, -300_000);
  assert.equal(r.gananciaReal, 0);
  casi(r.rendimientoPct, 0);
});

test("sin movimientos la ganancia es la diferencia de valores", () => {
  const r = calcularRendimiento(200, 230, []);
  assert.equal(r.gananciaReal, 30);
  casi(r.rendimientoPct, 15);
});

test("con base cero o negativa el porcentaje es null, no infinito", () => {
  assert.equal(calcularRendimiento(0, 100, []).rendimientoPct, null);
});

// --- rendimiento anualizado ---

test("anualizado no se calcula con menos de 30 dias de historial", () => {
  assert.equal(calcularRendimientoAnualizado(1000, 1020, 29), null);
});

test("anualizado a un año es el retorno total", () => {
  casi(calcularRendimientoAnualizado(1000, 1100, 365), 10);
});

test("anualizado sin capital aportado es null", () => {
  assert.equal(calcularRendimientoAnualizado(0, 100, 365), null);
});

// --- efecto tipo de cambio ---

test("efecto tipo de cambio entre dos tasas", () => {
  casi(calcularEfectoTipoCambio(990, 900), 10);
});

test("efecto tipo de cambio sin tasa anterior es null", () => {
  assert.equal(calcularEfectoTipoCambio(990, null), null);
  assert.equal(calcularEfectoTipoCambio(990, 0), null);
});

// --- racha ---

test("racha cuenta periodos consecutivos del mismo signo desde el mas reciente", () => {
  assert.deepEqual(calcularRacha([1, 2, 0.5, -3, 4]), { tipo: "positiva", longitud: 3 });
  assert.deepEqual(calcularRacha([-1, -2, 5]), { tipo: "negativa", longitud: 2 });
});

test("racha se corta con un periodo null y es vacia sin datos", () => {
  assert.deepEqual(calcularRacha([1, null, 2]), { tipo: "positiva", longitud: 1 });
  assert.deepEqual(calcularRacha([]), { tipo: null, longitud: 0 });
  assert.deepEqual(calcularRacha([null, 1]), { tipo: null, longitud: 0 });
});

// --- TWR y drawdown ---

test("TWR encadena los rendimientos por periodo", () => {
  casi(calcularTWR([10, 10]), 21);
});

test("TWR omite periodos null en vez de tratarlos como 0%", () => {
  casi(calcularTWR([10, null, 10]), 21);
  assert.equal(calcularTWR([null]), null);
});

test("maximo drawdown es la peor caida desde un maximo", () => {
  // 100 -> 120 -> 90 (cae 25% desde 120) -> 99
  casi(calcularMaxDrawdown([20, -25, 10]), -25);
});

test("drawdown sin caidas es 0 y sin datos es null", () => {
  casi(calcularMaxDrawdown([5, 5]), 0);
  assert.equal(calcularMaxDrawdown([]), null);
});

// --- retornos del portafolio ---

test("un aporte al portafolio no aparece como retorno", () => {
  // el valor sube de 1000 a 1500 pero 500 son aporte nuevo: retorno 0%
  const retornos = calcularRetornosPortafolio([
    { valorTotalClp: 1000, capitalAportadoAcumuladoClp: 1000 },
    { valorTotalClp: 1500, capitalAportadoAcumuladoClp: 1500 },
  ]);
  assert.equal(retornos.length, 1);
  casi(retornos[0], 0);
});

test("retorno del portafolio con ganancia de mercado", () => {
  const retornos = calcularRetornosPortafolio([
    { valorTotalClp: 1000, capitalAportadoAcumuladoClp: 1000 },
    { valorTotalClp: 1100, capitalAportadoAcumuladoClp: 1000 },
  ]);
  casi(retornos[0], 10);
});

// --- XIRR ---

test("XIRR de un aporte y su valor un año despues", () => {
  casi(
    calcularXIRR([
      { fecha: "2025-01-01", monto: -1000 },
      { fecha: "2026-01-01", monto: 1100 },
    ]),
    10,
    1e-3
  );
});

test("XIRR necesita flujos de ambos signos", () => {
  assert.equal(calcularXIRR([{ fecha: "2025-01-01", monto: -1000 }]), null);
  assert.equal(
    calcularXIRR([
      { fecha: "2025-01-01", monto: -1000 },
      { fecha: "2026-01-01", monto: -500 },
    ]),
    null
  );
});
