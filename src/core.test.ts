import { test } from "node:test";
import assert from "node:assert";
import { Scale, niceTicks } from "./core/scale.js";
import { BrailleCanvas } from "./core/canvas.js";
import { stripAnsi, pad } from "./core/ansi.js";

test("Scale linear maps domain to range", () => {
  const s = new Scale({ domain: [0, 10], range: [0, 100] });
  assert.strictEqual(s.map(0), 0);
  assert.strictEqual(s.map(5), 50);
  assert.strictEqual(s.map(10), 100);
});

test("Scale clamping works", () => {
  const s = new Scale({ domain: [0, 10], range: [0, 100], clamp: true });
  assert.strictEqual(s.map(-5), 0);
  assert.strictEqual(s.map(15), 100);
});

test("niceTicks returns clean steps", () => {
  const ticks = niceTicks(0, 100, 5);
  assert.deepStrictEqual(ticks, [0, 20, 40, 60, 80, 100]);
});

test("BrailleCanvas set/get pixels", () => {
  const c = new BrailleCanvas(10, 10);
  c.set(0, 0, 1);
  c.set(1, 1, 1);
  assert.strictEqual(c.get(0, 0), 1);
  assert.strictEqual(c.get(1, 1), 1);
  assert.strictEqual(c.get(2, 2), 0);
});

test("stripAnsi removes color escapes", () => {
  const raw = "\x1b[31mRed\x1b[0m Text";
  assert.strictEqual(stripAnsi(raw), "Red Text");
});

test("pad centers/left/right aligns text", () => {
  assert.strictEqual(pad("ok", 6, "left"), "ok    ");
  assert.strictEqual(pad("ok", 6, "right"), "    ok");
  assert.strictEqual(pad("ok", 6, "center"), "  ok  ");
});
