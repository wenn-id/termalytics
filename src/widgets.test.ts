import { test } from "node:test";
import assert from "node:assert";
import { lineChart, barChart, sparkline, gauge } from "./widgets/chart.js";
import { stripAnsi } from "./core/ansi.js";

test("sparkline renders correct height blocks", () => {
  const spark = sparkline([1, 5, 10], { width: 3 });
  const raw = stripAnsi(spark);
  assert.strictEqual(raw.length, 3);
  assert.strictEqual(raw[0], "▁"); // lowest
  assert.strictEqual(raw[1], "▄"); // mid
  assert.strictEqual(raw[2], "█"); // highest
});

test("gauge builds correct width filled bar", () => {
  const g = gauge(50, 100, { width: 10 });
  const raw = stripAnsi(g);
  // Expected structure: "[█████░░░░░] 50.0%"
  assert.ok(raw.includes("[█████░░░░░]"));
  assert.ok(raw.includes("50.0%"));
});

test("barChart returns labels and values", () => {
  const data = [
    { label: "A", value: 10 },
    { label: "B", value: 20 },
  ];
  const rendered = stripAnsi(barChart(data, { width: 40 }));
  assert.ok(rendered.includes("A"));
  assert.ok(rendered.includes("B"));
  assert.ok(rendered.includes("10"));
  assert.ok(rendered.includes("20"));
});
