/**
 * Live dashboard demo — updates every 500ms with random system-like metrics.
 * Run: npx tsx examples/live-dashboard.ts
 * Press Ctrl+C to exit.
 */

import {
  lineChart, sparkline, gauge, table, panel, stack,
  liveScreen, termSize, Color, wrap,
} from "../src/index.js";

const history = { cpu: [] as number[], mem: [] as number[], net: [] as number[] };
const MAX = 60;

function pushMetric(arr: number[], val: number) {
  arr.push(val);
  if (arr.length > MAX) arr.shift();
}

function randomWalk(prev: number, lo: number, hi: number): number {
  const delta = (Math.random() - 0.5) * 15;
  return Math.max(lo, Math.min(hi, prev + delta));
}

let cpu = 50, mem = 60, net = 30;

liveScreen({
  interval: 500,
  render() {
    cpu = randomWalk(cpu, 5, 98);
    mem = randomWalk(mem, 20, 95);
    net = randomWalk(net, 0, 100);
    pushMetric(history.cpu, cpu);
    pushMetric(history.mem, mem);
    pushMetric(history.net, net);

    const { cols } = termSize();
    const w = Math.min(cols - 4, 100);
    const now = new Date().toISOString().slice(11, 19);

    const header = wrap(
      `  ╔══ Termalytics Live Dashboard ══╗  ${now}`,
      Color.Bold, Color.BrightCyan,
    );

    const chart = lineChart([history.cpu, history.mem], {
      title: "CPU / Memory %",
      width: w,
      height: 10,
      min: 0, max: 100,
      series: [
        { label: "CPU", color: Color.Cyan },
        { label: "Memory", color: Color.Yellow },
      ],
    });

    const sparks = [
      "  CPU  " + sparkline(history.cpu, { color: Color.Cyan, width: w - 10 }),
      "  MEM  " + sparkline(history.mem, { color: Color.Yellow, width: w - 10 }),
      "  NET  " + sparkline(history.net, { color: Color.Green, width: w - 10 }),
    ].join("\n");

    const gauges = [
      "  " + gauge(cpu, 100, { label: "CPU ", width: 25 }),
      "  " + gauge(mem, 100, { label: "MEM ", width: 25 }),
      "  " + gauge(net, 100, { label: "NET ", width: 25 }),
    ].join("\n");

    const tbl = table(
      ["Metric", "Current", "Min", "Max", "Avg"],
      [
        ["CPU %", cpu.toFixed(1), Math.min(...history.cpu).toFixed(1), Math.max(...history.cpu).toFixed(1), (history.cpu.reduce((a, b) => a + b, 0) / history.cpu.length).toFixed(1)],
        ["MEM %", mem.toFixed(1), Math.min(...history.mem).toFixed(1), Math.max(...history.mem).toFixed(1), (history.mem.reduce((a, b) => a + b, 0) / history.mem.length).toFixed(1)],
        ["NET %", net.toFixed(1), Math.min(...history.net).toFixed(1), Math.max(...history.net).toFixed(1), (history.net.reduce((a, b) => a + b, 0) / history.net.length).toFixed(1)],
      ],
    );

    return stack([header, "", chart, "", sparks, "", gauges, "", tbl, "", wrap("  Press Ctrl+C to exit", Color.Dim)]);
  },
});
