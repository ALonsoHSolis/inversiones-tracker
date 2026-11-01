import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoPesosCompacto } from "./formato.ts";

test("formatoPesosCompacto abrevia millones y miles", () => {
  assert.equal(formatoPesosCompacto(12_589_150), "$12,6 M");
  assert.equal(formatoPesosCompacto(1_000_000), "$1 M");
  assert.equal(formatoPesosCompacto(850_400), "$850 mil");
  assert.equal(formatoPesosCompacto(999), "$999");
  assert.equal(formatoPesosCompacto(0), "$0");
  assert.equal(formatoPesosCompacto(-2_500_000), "−$2,5 M");
});
