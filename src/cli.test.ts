import { execFileSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert";

function runLive(command: string, input: string): string {
  return execFileSync(
    process.execPath,
    ["--import", "tsx", "src/bin/cli.ts", command, "--live"],
    { cwd: process.cwd(), input, encoding: "utf8" },
  );
}

test("live table renders NDJSON table snapshots", () => {
  const output = runLive(
    "table",
    '{"headers":["Service","Status"],"rows":[["api","ok"]]}\n',
  );
  assert.ok(output.includes("Service"));
  assert.ok(output.includes("api"));
  assert.ok(output.includes("ok"));
});

test("live heatmap renders NDJSON matrix snapshots", () => {
  const output = runLive(
    "heatmap",
    '{"matrix":[[1,2]],"rowLabels":["r1"],"colLabels":["a","b"]}\n',
  );
  assert.ok(output.includes("r1"));
  assert.ok(output.includes("1"));
  assert.ok(output.includes("2"));
});

test("CLI non-live table renders from NDJSON", () => {
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", "src/bin/cli.ts", "table"],
    {
      cwd: process.cwd(),
      input: '{"headers":["A","B"],"rows":[["x","y"]]}\n',
      encoding: "utf8",
    },
  );
  assert.ok(output.includes("A"));
  assert.ok(output.includes("x"));
  assert.ok(output.includes("y"));
});
