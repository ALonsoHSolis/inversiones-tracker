import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoPct, formatoPesosCompacto, formatoPorcentaje } from "./formato.ts";

test("formatoPesosCompacto abrevia millones y miles", () => {
  assert.equal(formatoPesosCompacto(12_589_150), "$12,6 M");
  assert.equal(formatoPesosCompacto(1_000_000), "$1 M");
  assert.equal(formatoPesosCompacto(850_400), "$850 mil");
  assert.equal(formatoPesosCompacto(999), "$999");
  assert.equal(formatoPesosCompacto(0), "$0");
  assert.equal(formatoPesosCompacto(-2_500_000), "−$2,5 M");
  assert.equal(formatoPesosCompacto(3_221_276_008), "$3.221 M");
  assert.equal(formatoPesosCompacto(150_400_000), "$150 M");
});

test("formatoPct usa coma decimal y conserva signo y redondeo a 1 decimal", () => {
  assert.equal(formatoPct(3.3), "+3,3%");
  assert.equal(formatoPct(-2.64), "−2,6%");
  assert.equal(formatoPct(0), "+0,0%");
  assert.equal(formatoPct(1234.56), "+1.234,6%");
  assert.equal(formatoPorcentaje(38.44), "38,4%");
});

test("normalizarMontoIngresado interpreta separadores chilenos sin inflar montos", async () => {
  const { normalizarMontoIngresado } = await import("./formato.ts");
  assert.equal(normalizarMontoIngresado("1234,5"), "1234.5"); // antes: "12345"
  assert.equal(normalizarMontoIngresado("1.234,56"), "1234.56");
  assert.equal(normalizarMontoIngresado("1.234.567"), "1234567"); // antes: NaN
  assert.equal(normalizarMontoIngresado("$ 2.500.000"), "2500000");
  // sin cambios respecto al comportamiento anterior:
  assert.equal(normalizarMontoIngresado("1500000"), "1500000");
  assert.equal(normalizarMontoIngresado("37.25"), "37.25");
  assert.equal(normalizarMontoIngresado(""), "");
  assert.equal(normalizarMontoIngresado("12,"), "12.");
});
