import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularParticipaciones } from "./distribucion.ts";

test("las participaciones suman 100 y asignan colores distintos", () => {
  const p = calcularParticipaciones([
    { nombre: "A", capitalAportadoClp: 100, valorActualClp: 600 },
    { nombre: "B", capitalAportadoClp: 300, valorActualClp: 300 },
    { nombre: "C", capitalAportadoClp: 100, valorActualClp: 100 },
  ]);
  assert.ok(Math.abs(p.reduce((a, x) => a + x.porcentaje, 0) - 100) < 1e-9);
  assert.equal(new Set(p.map((x) => x.color)).size, 3);
  assert.equal(p[0].gananciaClp, 500);
  assert.equal(p[0].gananciaPct, 500);
});

test("sin capital aportado la ganancia % es null; sin total, 0%", () => {
  const p = calcularParticipaciones([{ nombre: "A", capitalAportadoClp: 0, valorActualClp: 0 }]);
  assert.equal(p[0].gananciaPct, null);
  assert.equal(p[0].porcentaje, 0);
});
