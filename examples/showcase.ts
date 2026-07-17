/**
 * Static showcase of every Termalytics widget.
 * Run: npx tsx examples/showcase.ts
 */

import {
  lineChart, barChart, sparkline, gauge, table, heatmap, Color,
} from "../src/index.js";

const sine = Array.from({ length: 60 }, (_, i) => Math.sin(i / 6) * 50 + 50);
const cosine = Array.from({ length: 60 }, (_, i) => Math.cos(i / 6) * 30 + 50);

console.log("\n" + "═".repeat(70));
console.log("  TERMALYTICS — showcase");
console.log("═".repeat(70) + "\n");

console.log(lineChart([sine, cosine], {
  title: "Line chart — two series (braille)",
  width: 64,
  height: 12,
  series: [{ label: "sin", color: Color.Cyan }, { label: "cos", color: Color.Magenta }],
}));

console.log("\n");
console.log(barChart(
  [
    { label: "Rust", value: 89 },
    { label: "Go", value: 71 },
    { label: "TypeScript", value: 95 },
    { label: "Python", value: 82 },
    { label: "Zig", value: 44 },
  ],
  { title: "Bar chart — language popularity", width: 60 },
));

console.log("\n  Sparklines:");
console.log("    CPU  " + sparkline([20, 35, 40, 30, 55, 70, 65, 80, 75, 90, 60, 45], { color: Color.Green }));
console.log("    MEM  " + sparkline([50, 52, 48, 60, 65, 62, 70, 68, 72, 75, 74, 78], { color: Color.Yellow }));
console.log("    NET  " + sparkline([5, 90, 12, 45, 88, 20, 95, 33, 70, 15, 60, 40], { color: Color.Cyan }));

console.log("\n  Gauges:");
console.log("    " + gauge(72, 100, { label: "Disk    ", width: 30 }));
console.log("    " + gauge(45, 100, { label: "Memory  ", width: 30 }));
console.log("    " + gauge(93, 100, { label: "CPU load", width: 30 }));

console.log("\n");
console.log(table(
  ["Service", "Status", "Latency", "Uptime"],
  [
    ["api-gateway", "healthy", "12ms", "99.98%"],
    ["auth-svc", "healthy", "8ms", "99.99%"],
    ["db-primary", "degraded", "45ms", "99.82%"],
    ["cache", "healthy", "2ms", "100.0%"],
  ],
  { title: "Service health", align: ["left", "left", "right", "right"] },
));

console.log("\n");
const matrix = Array.from({ length: 5 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => Math.round(Math.sin(r / 2) * Math.cos(c / 3) * 50 + 50)),
);
console.log(heatmap(matrix, {
  title: "Heatmap — activity by hour/day",
  rowLabels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  colLabels: ["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"],
}));

console.log("\n" + "═".repeat(70) + "\n");
