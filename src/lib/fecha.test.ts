import { test } from "node:test";
import assert from "node:assert/strict";
import { fechaChile, fechaChileHaceDias, fechaHoyChile } from "./fecha.ts";

test("de noche en verano (UTC-3) el dia sigue siendo el de Chile, no el UTC", () => {
  // 01:30 UTC del 15 de enero = 22:30 del 14 de enero en Chile (horario de verano)
  assert.equal(fechaChile(new Date("2026-01-15T01:30:00Z")), "2026-01-14");
});

test("de noche en invierno (UTC-4) el dia sigue siendo el de Chile, no el UTC", () => {
  // 01:30 UTC del 15 de julio = 21:30 del 14 de julio en Chile (horario de invierno)
  assert.equal(fechaChile(new Date("2026-07-15T01:30:00Z")), "2026-07-14");
});

test("pasada la medianoche local ya es el dia siguiente", () => {
  // 05:00 UTC del 15 de julio = 01:00 del 15 de julio en Chile
  assert.equal(fechaChile(new Date("2026-07-15T05:00:00Z")), "2026-07-15");
});

test("fechaHoyChile usa el instante recibido", () => {
  assert.equal(fechaHoyChile(new Date("2026-10-31T21:12:00Z")), "2026-10-31");
});

test("fechaChileHaceDias resta dias de calendario", () => {
  assert.equal(fechaChileHaceDias(30, new Date("2026-10-31T15:00:00Z")), "2026-10-01");
});
