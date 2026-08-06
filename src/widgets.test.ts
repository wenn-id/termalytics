import { test } from "node:test";
import assert from "node:assert";
import { lineChart, barChart, sparkline, gauge, table, heatmap } from "./widgets/chart.js";
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

/* ---- table & heatmap widget characterization tests ---- */

test("table renders bordered rows with headers", () => {
  const t = table(
    ["Service", "Status", "Latency"],
    [
      ["api-gw", "healthy", "12ms"],
      ["db", "degraded", "45ms"],
    ],
    { title: "Services" },
  );
  const raw = stripAnsi(t);
  const lines = raw.split("\n");
  assert.ok(lines[0]!.includes("Services"));
  assert.ok(lines[1]!.includes("┌"));
  assert.ok(lines[1]!.includes("┬"));
  assert.ok(lines[1]!.includes("┐"));
  assert.ok(lines[2]!.includes("Service"));
  assert.ok(lines[2]!.includes("Status"));
  assert.ok(lines[3]!.includes("├"));
  assert.ok(lines[4]!.includes("api-gw"));
  assert.ok(lines[4]!.includes("healthy"));
  assert.ok(lines[4]!.includes("12ms"));
  assert.ok(lines[5]!.includes("db"));
  assert.ok(lines[6]!.includes("└"));
});

test("table columns align to widest cell", () => {
  const t = table(["A", "B"], [["x", "very-long-value"]]);
  const raw = stripAnsi(t);
  const lines = raw.split("\n");
  assert.ok(lines[1]!.length > 10);
  assert.ok(lines[3]!.includes("very-long-value"));
});

test("table returns empty string for empty headers", () => {
  assert.strictEqual(table([], []), "");
});

test("heatmap renders all cells with values", () => {
  const h = heatmap(
    [
      [0, 50],
      [100, 25],
    ],
    { title: "Load", rowLabels: ["r1", "r2"], colLabels: ["c1", "c2"] },
  );
  const raw = stripAnsi(h);
  const lines = raw.split("\n");
  assert.ok(lines[0]!.includes("Load"));
  assert.ok(lines[1]!.includes("c1"));
  assert.ok(lines[1]!.includes("c2"));
  assert.ok(lines[2]!.includes("r1"));
  assert.ok(lines[2]!.includes("0"));
  assert.ok(lines[2]!.includes("50"));
  assert.ok(lines[3]!.includes("r2"));
  assert.ok(lines[3]!.includes("100"));
  assert.ok(lines[3]!.includes("25"));
});

test("heatmap empty matrix returns empty string", () => {
  assert.strictEqual(heatmap([]), "");
  assert.strictEqual(heatmap([[]]), "");
});

test("heatmap normalizes min..max to full color range", () => {
  const h = heatmap([[42, 42]]);
  const raw = stripAnsi(h);
  assert.ok(raw.includes("42"));
});
