import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agruparCapital,
  calcularAlertasSalud,
  calcularMetasConProgreso,
  construirComposicion,
  nombreGrupoPorCuenta,
  porCategoria,
  porPlataforma,
  porTipo,
} from "./dashboard.ts";
import type { Cuenta } from "../types/database";

function cuenta(id: string, extra: Record<string, unknown>): Cuenta {
  return { id, nombre: `cuenta ${id}`, plataforma: "Fintual", tipo: "fondo_mutuo", categoria: null, ...extra } as unknown as Cuenta;
}
const capital = (c: number, v: number, ultima?: string) => ({
  capital_aportado_clp: c,
  valor_actual_clp: v,
  ultima_fecha: ultima ?? null,
});

test("agrupa por plataforma sin distinguir mayusculas ni espacios, y ordena por valor", () => {
  const cuentas = [
    cuenta("a", { plataforma: " Fintual " }),
    cuenta("b", { plataforma: "fintual" }),
    cuenta("c", { plataforma: "Racional" }),
  ];
  const cap = new Map([
    ["a", capital(100, 150)],
    ["b", capital(50, 70)],
    ["c", capital(500, 400)],
  ]);
  const grupos = agruparCapital(cuentas, cap, porPlataforma);
  assert.equal(grupos.length, 2);
  assert.deepEqual(grupos[0], { nombre: "Racional", capitalAportadoClp: 500, valorActualClp: 400 });
  // el nombre mostrado es el de la primera cuenta del grupo, sin espacios sobrantes
  assert.deepEqual(grupos[1], { nombre: "Fintual", capitalAportadoClp: 150, valorActualClp: 220 });
});

test("una cuenta sin datos de capital suma 0 en vez de contaminar con NaN", () => {
  const grupos = agruparCapital([cuenta("a", {})], new Map(), porPlataforma);
  assert.deepEqual(grupos, [{ nombre: "Fintual", capitalAportadoClp: 0, valorActualClp: 0 }]);
});

test("agrupa por tipo usando la etiqueta legible", () => {
  const etiquetas = new Map([["fondo_mutuo", "Fondo mutuo"]]);
  const grupos = agruparCapital([cuenta("a", {})], new Map([["a", capital(10, 12)]]), porTipo(etiquetas));
  assert.equal(grupos[0].nombre, "Fondo mutuo");
});

test("las cuentas sin categoria quedan fuera del desglose por categoria", () => {
  const cuentas = [cuenta("a", { categoria: "  Retiro " }), cuenta("b", { categoria: null }), cuenta("c", { categoria: "   " })];
  const cap = new Map([
    ["a", capital(10, 12)],
    ["b", capital(10, 12)],
    ["c", capital(10, 12)],
  ]);
  const grupos = agruparCapital(cuentas, cap, porCategoria);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].nombre, "Retiro");
});

test("el nombre de grupo por cuenta usa el primer nombre visto de cada clave", () => {
  const cuentas = [cuenta("a", { plataforma: "Fintual" }), cuenta("b", { plataforma: "FINTUAL" })];
  const m = nombreGrupoPorCuenta(cuentas, porPlataforma);
  assert.equal(m.get("a"), "Fintual");
  assert.equal(m.get("b"), "Fintual");
});

test("la composicion rellena con 0 los grupos sin datos en cada fecha y ordena por total", () => {
  const nombres = new Map([
    ["a", "Fintual"],
    ["b", "Racional"],
  ]);
  const { puntos, grupos } = construirComposicion(
    [
      { fecha: "2026-02-01", cuenta_id: "a", valor_clp: 100 },
      { fecha: "2026-01-01", cuenta_id: "b", valor_clp: 900 },
      { fecha: "2026-02-01", cuenta_id: "b", valor_clp: 950 },
      { fecha: null, cuenta_id: "a", valor_clp: 5 },
    ],
    nombres
  );
  assert.deepEqual(grupos.map((g) => g.nombre), ["Racional", "Fintual"]);
  assert.deepEqual(puntos.map((p) => p.fecha), ["2026-01-01", "2026-02-01"]);
  assert.equal(puntos[0].Fintual, 0);
  assert.equal(puntos[1].Fintual, 100);
});

test("alertas de salud: dato antiguo (>14 dias), salto implausible (>=80%) y hueco (>45 dias)", () => {
  const hoy = new Date("2026-10-31").getTime();
  const cuentas = [cuenta("a", {})];
  const historial = new Map([
    [
      "a",
      [
        { fecha: "2026-01-01", rendimientoPct: 1 },
        { fecha: "2026-03-01", rendimientoPct: 85 }, // hueco de 59 dias y salto de 85%
        { fecha: "2026-03-08", rendimientoPct: 2 },
      ],
    ],
  ]);
  const [alerta] = calcularAlertasSalud(cuentas, new Map([["a", capital(1, 1, "2026-10-01")]]), historial, hoy);
  assert.ok(alerta.diasSinActualizar !== null && alerta.diasSinActualizar > 14);
  assert.deepEqual(alerta.saltos, [{ fecha: "2026-03-01", pct: 85 }]);
  assert.equal(alerta.gaps.length, 1);
  assert.equal(alerta.gaps[0].fechaFin, "2026-03-01");
});

test("alertas de salud: una cuenta al dia no genera alertas", () => {
  const hoy = new Date("2026-10-31").getTime();
  const [alerta] = calcularAlertasSalud([cuenta("a", {})], new Map([["a", capital(1, 1, "2026-10-28")]]), new Map(), hoy);
  assert.equal(alerta.diasSinActualizar, null);
  assert.deepEqual(alerta.saltos, []);
  assert.deepEqual(alerta.gaps, []);
});

test("el progreso de una meta suma el valor actual de sus cuentas asociadas", () => {
  const metas = [{ id: "m1", nombre: "Casa", monto_objetivo: 1000, fecha_objetivo: null }];
  const metaCuentas = [
    { meta_id: "m1", cuenta_id: "a" },
    { meta_id: "m1", cuenta_id: "dada-de-baja" },
  ];
  const cap = new Map([["a", capital(100, 300)]]);
  const [meta] = calcularMetasConProgreso(metas, metaCuentas, cap, new Map([["a", "Fondo A"]]));
  assert.equal(meta.montoActualClp, 300);
  // la cuenta dada de baja no figura en el mapa de nombres, asi que no aparece
  assert.deepEqual(meta.cuentasAsociadas, ["Fondo A"]);
});
