import { test } from "node:test";
import assert from "node:assert/strict";
import { padreDe, seccionActiva, tituloDe, SECCIONES, SECCIONES_MAS, SECCIONES_MOVIL } from "./navegacion.ts";

test("seccionActiva reconoce paginas raiz y subpaginas", () => {
  assert.equal(seccionActiva("/dashboard"), "resumen");
  assert.equal(seccionActiva("/cuentas"), "cuentas");
  assert.equal(seccionActiva("/cuentas/nueva"), "cuentas");
  assert.equal(seccionActiva("/cuentas/abc/historial"), "cuentas");
  assert.equal(seccionActiva("/metas/nueva"), "metas");
  assert.equal(seccionActiva("/informe"), "informes");
  assert.equal(seccionActiva("/perfil"), "configuracion");
});

test("seccionActiva no confunde prefijos parecidos ni rutas ajenas", () => {
  assert.equal(seccionActiva("/cuentasx"), null);
  assert.equal(seccionActiva("/blog"), null);
  assert.equal(seccionActiva("/"), null);
});

test("tituloDe usa titulo propio en subpaginas", () => {
  assert.equal(tituloDe("/dashboard"), "Resumen");
  assert.equal(tituloDe("/cuentas/nueva"), "Agregar cuenta");
  assert.equal(tituloDe("/cuentas/inactivas"), "Cuentas inactivas");
  assert.equal(tituloDe("/cuentas/9f1/editar"), "Editar cuenta");
  assert.equal(tituloDe("/cuentas/9f1/historial"), "Historial de la cuenta");
  assert.equal(tituloDe("/metas/nueva"), "Nueva meta");
  assert.equal(tituloDe("/desconocida"), "Mi portafolio");
});

test("padreDe solo existe en subpaginas", () => {
  assert.equal(padreDe("/dashboard"), null);
  assert.equal(padreDe("/cuentas"), null);
  assert.deepEqual(padreDe("/cuentas/nueva"), { href: "/cuentas", etiqueta: "Cuentas" });
  assert.deepEqual(padreDe("/cuentas/x/editar"), { href: "/cuentas", etiqueta: "Cuentas" });
  assert.deepEqual(padreDe("/metas/nueva"), { href: "/metas", etiqueta: "Metas" });
});

test("movil + mas cubren todas las secciones sin repetir", () => {
  const todas = [...SECCIONES_MOVIL, ...SECCIONES_MAS].sort();
  assert.deepEqual(todas, SECCIONES.map((s) => s.id).sort());
});
