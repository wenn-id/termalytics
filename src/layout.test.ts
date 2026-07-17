import { test } from "node:test";
import assert from "node:assert";
import { panel, grid, stack } from "./widgets/layout.js";
import { stripAnsi } from "./core/ansi.js";

test("panel renders box around content", () => {
  const p = panel(["hello"], { border: true, paddingX: 1, paddingY: 0 });
  const lines = stripAnsi(p).split("\n");
  assert.ok(lines[0]!.includes("┌"));
  assert.ok(lines[0]!.includes("┐"));
  assert.ok(lines[1]!.includes("│"));
  assert.ok(lines[1]!.includes("hello"));
  assert.ok(lines[2]!.includes("└"));
});

test("panel padding adds space around content", () => {
  const p = panel(["hi"], { border: true, paddingX: 2, paddingY: 0 });
  const bodyLine = stripAnsi(p).split("\n")[1]!;
  // Should have at least 2 spaces on each side of "hi"
  assert.ok(bodyLine.includes("│  hi  │"));
});

test("grid arranges 4 cells into 2x2", () => {
  const cells = ["A", "B", "C", "D"];
  const g = grid(cells, { columns: 2, width: 20, gap: 2 });
  const lines = g.split("\n");
  // 4 cells / 2 cols = 2 cell-rows, each 1 text line = 2 total lines
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[0]!.includes("A"));
  assert.ok(lines[0]!.includes("B"));
  assert.ok(lines[1]!.includes("C"));
  assert.ok(lines[1]!.includes("D"));
});

test("stack joins panels with gap newlines", () => {
  const s = stack(["one", "two"], { gap: 2 });
  assert.strictEqual(s, "one\n\ntwo");
});
