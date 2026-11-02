import { test } from "node:test";
import assert from "node:assert/strict";
import { ALTO, ANCHO, construirGeometria, filtrarPeriodo, indiceMasCercano } from "./grafico-patrimonio.ts";

const p = (fecha: string, totalClp: number, capitalClp: number) => ({ fecha, totalClp, capitalClp });

test("geometria: X proporcional a la fecha, Y dentro del lienzo", () => {
  const g = construirGeometria([p("2026-01-01", 100, 100), p("2026-01-11", 150, 120), p("2026-03-01", 200, 120)])!;
  assert.equal(g.xs[0], 0);
  assert.equal(g.xs[2], ANCHO);
  // 10 de 59 dias -> ~169 de 1000
  assert.ok(Math.abs(g.xs[1] - (10 / 59) * ANCHO) < 0.01);
  for (const y of [...g.ysTotal, ...g.ysCapital]) assert.ok(y > 0 && y < ALTO);
  // el maximo queda arriba (y menor) que el minimo
  assert.ok(g.ysTotal[2] < g.ysTotal[0]);
});

test("geometria: capital en escalones y linea con rectas entre registros", () => {
  const g = construirGeometria([p("2026-01-01", 100, 100), p("2026-01-02", 110, 150)])!;
  assert.match(g.linea, /^M0 [\d.]+ L1000 [\d.]+$/);
  // escalon: horizontal hasta el nuevo registro y luego vertical
  assert.equal(g.capital.split("L").length, 3);
  assert.equal(construirGeometria([p("2026-01-01", 1, 1)]), null);
});

test("geometria: valores iguales no dividen por cero", () => {
  const g = construirGeometria([p("2026-01-01", 500, 500), p("2026-01-02", 500, 500)])!;
  assert.ok(g.ysTotal.every((y) => Number.isFinite(y)));
});

test("filtrarPeriodo y indiceMasCercano", () => {
  const pts = [p("2025-01-01", 1, 1), p("2026-10-15", 2, 1), p("2026-11-01", 3, 1)];
  assert.equal(filtrarPeriodo(pts, "1M").puntos.length, 2);
  assert.equal(filtrarPeriodo(pts, "Máx").puntos.length, 3);
  const corto = filtrarPeriodo([p("2025-01-01", 1, 1), p("2026-11-01", 3, 1)], "1M");
  assert.equal(corto.insuficiente, true);
  assert.equal(indiceMasCercano([0, 400, 1000], 0.45), 1);
  assert.equal(indiceMasCercano([0, 400, 1000], 2), 2);
});

test("aportesPorFecha: el salto del capital aportado, con signo, sin el primer registro", async () => {
  const { aportesPorFecha } = await import("./grafico-patrimonio.ts");
  const m = aportesPorFecha([p("2026-01-01", 100, 100), p("2026-01-08", 160, 150), p("2026-01-15", 170, 150), p("2026-01-22", 140, 120)]);
  assert.deepEqual([...m.entries()], [["2026-01-08", 50], ["2026-01-22", -30]]);
});
