import { test } from "node:test";
import assert from "node:assert/strict";
import { construirActividad } from "./actividad.ts";
import { formatoMontoNativo } from "./formato.ts";

const cuentas = [
  { id: "a", nombre: "Fintual", moneda: "CLP" },
  { id: "b", nombre: "Racional USD", moneda: "USD" },
];
const AHORA = new Date("2026-11-01T18:00:00Z");

test("agrupa en Hoy / Ayer / Anteriores y ordena de lo mas nuevo a lo mas viejo", () => {
  const g = construirActividad({
    movimientos: [
      { cuenta_id: "a", fecha: "2026-10-20", tipo: "aporte", monto: 100 },
      { cuenta_id: "b", fecha: "2026-10-31", tipo: "retiro", monto: 50 },
      { cuenta_id: "a", fecha: "2026-11-01", tipo: "aporte", monto: 300 },
    ],
    cuentas,
    hoy: "2026-11-01",
    ahora: AHORA,
  });
  assert.deepEqual(g.map((x) => x.etiqueta), ["Hoy", "Ayer", "Anteriores"]);
  assert.equal(g[0].items[0].monto, 300);
  assert.equal(g[1].items[0].tipo, "retiro");
});

test("omite cuentas inactivas, cuenta null y tipos desconocidos", () => {
  const g = construirActividad({
    movimientos: [
      { cuenta_id: "x", fecha: "2026-11-01", tipo: "aporte", monto: 1 },
      { cuenta_id: null, fecha: "2026-11-01", tipo: "aporte", monto: 1 },
      { cuenta_id: "a", fecha: "2026-11-01", tipo: "otro", monto: 1 },
    ],
    cuentas,
    hoy: "2026-11-01",
    ahora: AHORA,
  });
  assert.deepEqual(g, []);
});

test("respeta el limite y con la misma fecha va primero el mas tardio de la entrada", () => {
  const movimientos = Array.from({ length: 10 }, (_, i) => ({
    cuenta_id: "a",
    fecha: "2026-10-10",
    tipo: "aporte",
    monto: i + 1,
  }));
  const g = construirActividad({ movimientos, cuentas, hoy: "2026-11-01", limite: 3, ahora: AHORA });
  assert.deepEqual(g[0].items.map((i) => i.monto), [10, 9, 8]);
});

test("ayer se deriva de hoy cuando hoy no es el dia de ahora (cambio de mes)", () => {
  const g = construirActividad({
    movimientos: [{ cuenta_id: "a", fecha: "2026-02-28", tipo: "aporte", monto: 5 }],
    cuentas,
    hoy: "2026-03-01",
    ahora: AHORA,
  });
  assert.equal(g[0].etiqueta, "Ayer");
});

test("montos en moneda nativa, sin signo", () => {
  assert.match(formatoMontoNativo(1500, "CLP"), /1\.500/);
  assert.match(formatoMontoNativo(25.5, "USD"), /\$25\.50/);
  assert.match(formatoMontoNativo(10.5, "UF"), /UF$/);
});
