import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agruparPorPlataforma,
  filtrarCuentas,
  FILTROS_VACIOS,
  ordenarCuentas,
  opcionesPlataforma,
  totalClp,
  type FilaCuenta,
} from "./cuentas-tabla.ts";

const fila = (o: Partial<FilaCuenta> & { id: string; nombre: string }): FilaCuenta => ({
  plataforma: "Banco",
  tipo: "fondo_mutuo",
  tipoLabel: "Fondo mutuo",
  moneda: "CLP",
  valorClp: 0,
  rendimientoPct: null,
  anualizadoPct: null,
  aporteNeto: null,
  ultimaFecha: null,
  diasSinActualizar: null,
  datoAntiguo: false,
  ...o,
});

const filas = [
  fila({ id: "1", nombre: "Fondo Conservador", valorClp: 5_000_000, rendimientoPct: 0.7, ultimaFecha: "2026-10-30" }),
  fila({ id: "2", nombre: "Acciones USA", plataforma: "Broker", tipo: "acciones", tipoLabel: "Acciones", moneda: "USD", valorClp: 3_000_000, rendimientoPct: -1.2, ultimaFecha: "2026-10-01" }),
  fila({ id: "3", nombre: "Depósito UF", plataforma: "banco ", tipo: "deposito_plazo", tipoLabel: "Depósito a plazo", moneda: "UF", valorClp: 4_000_000, rendimientoPct: null }),
];

test("busca ignorando mayusculas y tildes, en nombre, plataforma y tipo", () => {
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, texto: "deposito" }).map((c) => c.id), ["3"]);
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, texto: "BROKER" }).map((c) => c.id), ["2"]);
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, texto: "xyz" }), []);
});

test("filtra por tipo, moneda y plataforma (normalizada)", () => {
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, tipo: "acciones" }).map((c) => c.id), ["2"]);
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, moneda: "UF" }).map((c) => c.id), ["3"]);
  assert.deepEqual(filtrarCuentas(filas, { ...FILTROS_VACIOS, plataforma: "banco" }).map((c) => c.id), ["1", "3"]);
});

test("ordena por valor en ambas direcciones", () => {
  assert.deepEqual(ordenarCuentas(filas, "valor", "desc").map((c) => c.id), ["1", "3", "2"]);
  assert.deepEqual(ordenarCuentas(filas, "valor", "asc").map((c) => c.id), ["2", "3", "1"]);
});

test("los valores faltantes van al final sin importar la direccion", () => {
  assert.equal(ordenarCuentas(filas, "rendimiento", "desc").at(-1)?.id, "3");
  assert.equal(ordenarCuentas(filas, "rendimiento", "asc").at(-1)?.id, "3");
  assert.deepEqual(ordenarCuentas(filas, "rendimiento", "desc").map((c) => c.id), ["1", "2", "3"]);
});

test("ordenar no muta el arreglo original", () => {
  const copia = filas.map((c) => c.id);
  ordenarCuentas(filas, "nombre", "asc");
  assert.deepEqual(filas.map((c) => c.id), copia);
});

test("agrupa por plataforma con subtotales y de mayor a menor", () => {
  const g = agruparPorPlataforma(filas);
  assert.deepEqual(g.map((x) => [x.plataforma, x.totalClp]), [["Banco", 9_000_000], ["Broker", 3_000_000]]);
  assert.equal(totalClp(filas), 12_000_000);
});

test("opciones de plataforma sin duplicados", () => {
  assert.deepEqual(opcionesPlataforma(filas).map((o) => o.clave), ["banco", "broker"]);
});
