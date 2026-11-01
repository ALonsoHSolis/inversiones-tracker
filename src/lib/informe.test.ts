import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularInformeMensual, esMesValido, mesesDisponibles } from "./informe.ts";

const p = (fecha: string, valor: number, capital: number) => ({
  fecha,
  valorTotalClp: valor,
  capitalAportadoAcumuladoClp: capital,
});

test("un deposito a mitad de mes no es ganancia", () => {
  const puntos = [p("2026-09-30", 10_000_000, 10_000_000), p("2026-10-15", 11_000_000, 11_000_000)];
  const r = calcularInformeMensual(puntos, "2026-10")!;
  assert.equal(r.aportesNetosClp, 1_000_000);
  assert.equal(r.gananciaMesClp, 0);
  assert.equal(r.gananciaMesPct, 0);
});

test("ganancia del mes = cambio de valor menos aportes netos", () => {
  const puntos = [p("2026-09-30", 10_000_000, 10_000_000), p("2026-10-31", 11_500_000, 11_000_000)];
  const r = calcularInformeMensual(puntos, "2026-10")!;
  assert.equal(r.gananciaMesClp, 500_000);
  assert.equal(r.gananciaAcumuladaClp, 500_000);
  assert.ok(Math.abs(r.gananciaMesPct! - (500_000 / 11_000_000) * 100) < 1e-9);
});

test("un retiro tampoco es perdida", () => {
  const puntos = [p("2026-09-30", 10_000_000, 10_000_000), p("2026-10-20", 8_100_000, 9_000_000)];
  const r = calcularInformeMensual(puntos, "2026-10")!;
  assert.equal(r.aportesNetosClp, -1_000_000);
  // cambio de valor -1.900.000, retiro -1.000.000 => ganancia real -900.000
  assert.equal(r.gananciaMesClp, -900_000);
});

test("cuenta creada dentro del mes: el aporte inicial cuenta como aporte, no como ganancia", () => {
  const r = calcularInformeMensual([p("2026-10-05", 5_000_000, 5_000_000), p("2026-10-31", 5_050_000, 5_000_000)], "2026-10")!;
  assert.equal(r.valorInicioClp, 0);
  assert.equal(r.aportesNetosClp, 5_000_000);
  assert.equal(r.gananciaMesClp, 50_000);
});

test("sin datos en el mes devuelve null, y los meses se listan del mas nuevo al mas antiguo", () => {
  const puntos = [p("2026-08-10", 1, 1), p("2026-10-02", 2, 1), p("2026-10-20", 3, 1)];
  assert.equal(calcularInformeMensual(puntos, "2026-09"), null);
  assert.deepEqual(mesesDisponibles(puntos), ["2026-10", "2026-08"]);
});

test("valida el formato del mes", () => {
  assert.equal(esMesValido("2026-10"), true);
  assert.equal(esMesValido("2026-13"), false);
  assert.equal(esMesValido("octubre"), false);
  assert.equal(esMesValido(undefined), false);
});
