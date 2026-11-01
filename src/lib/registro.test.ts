import { test } from "node:test";
import assert from "node:assert/strict";
import { advertenciaRegistro, calcularValorSugerido, estimarRendimientoPct, validarRegistro } from "./registro.ts";

test("valor sugerido suma o resta el movimiento al ultimo valor", () => {
  assert.equal(calcularValorSugerido(1000, "200", "aporte"), "1200");
  assert.equal(calcularValorSugerido(1000, "200", "retiro"), "800");
  assert.equal(calcularValorSugerido(null, "200", "aporte"), "200");
});

test("el rendimiento estimado descuenta el aporte (un deposito no es ganancia)", () => {
  // 1000 -> 1300 con aporte de 300 => 0 % real
  assert.equal(estimarRendimientoPct(1000, 1300, true, "aporte", "300"), 0);
  assert.equal(estimarRendimientoPct(null, 1300, false, "aporte", ""), null);
});

test("validarRegistro: campos obligatorios y reglas por moneda", () => {
  const ok = { valor: "1000", esClp: true, tasaCambio: null, incluyeMovimiento: false, movimientoMonto: "" };
  assert.deepEqual(validarRegistro(ok), {});
  assert.ok(validarRegistro({ ...ok, valor: "" }).valor);
  assert.ok(validarRegistro({ ...ok, valor: "-5" }).valor);
  assert.ok(validarRegistro({ ...ok, esClp: false }).tasa);
  assert.equal(validarRegistro({ ...ok, esClp: false, tasaCambio: 950 }).tasa, undefined);
  assert.ok(validarRegistro({ ...ok, incluyeMovimiento: true, movimientoMonto: "0" }).monto);
  assert.equal(validarRegistro({ ...ok, incluyeMovimiento: true, movimientoMonto: "50" }).monto, undefined);
});

test("advertencias: valor sin cambio con movimiento, y rendimiento implausible", () => {
  const base = { nombreCuenta: "Fondo", valorAnterior: 1000, valorNuevo: 1000, incluyeMovimiento: true, tipo: "aporte" as const, monto: "100" };
  assert.match(advertenciaRegistro(base) ?? "", /no cambió/);
  assert.match(advertenciaRegistro({ ...base, valorNuevo: 2000, incluyeMovimiento: false }) ?? "", /100\.0%/);
  assert.equal(advertenciaRegistro({ ...base, valorNuevo: 1010, incluyeMovimiento: false }), null);
  assert.equal(advertenciaRegistro({ ...base, valorAnterior: null, valorNuevo: 5000 }), null);
});
