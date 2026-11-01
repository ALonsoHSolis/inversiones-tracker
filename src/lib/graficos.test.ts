import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularEjeX } from "./graficos.ts";

const semanal = (inicio: string, n: number) =>
  Array.from({ length: n }, (_, i) => new Date(Date.parse(inicio) + i * 7 * 86400000).toISOString().slice(0, 10));

test("rango largo: una sola etiqueta por mes, sin repetir", () => {
  const { ticks, porDia } = calcularEjeX(semanal("2026-01-05", 40), 12);
  assert.equal(porDia, false);
  const meses = ticks.map((t) => t.slice(0, 7));
  assert.equal(new Set(meses).size, meses.length);
});

test("rango largo con muchos meses se adelgaza al maximo de etiquetas", () => {
  const { ticks } = calcularEjeX(semanal("2024-01-01", 120), 6);
  assert.ok(ticks.length <= 6);
});

test("rango corto usa etiquetas de dia, repartidas y sin duplicados", () => {
  const { ticks, porDia } = calcularEjeX(semanal("2026-10-01", 5), 6);
  assert.equal(porDia, true);
  assert.equal(new Set(ticks).size, ticks.length);
});

test("sin fechas no genera etiquetas", () => {
  assert.deepEqual(calcularEjeX([]), { ticks: [], porDia: false });
});
