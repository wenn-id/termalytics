#!/usr/bin/env node
/**
 * Termalytics CLI — render charts from stdin/CSV/JSON.
 * @module bin/cli
 */
import process from "node:process";
import { lineChart, barChart, sparkline, gauge, table, heatmap } from "../index.js";
function help() {
    return `
Termalytics — terminal dataviz CLI

Usage:
  termalytics <command> [options] < data

Commands:
  line      Braille line chart (multi-series)
  bar       Horizontal bar chart
  spark     Inline sparkline
  gauge     Progress gauge (single value)
  table     Bordered table
  heatmap   2D heatmap

Input formats (auto-detected from stdin):
  JSON  {"data":[1,2,3]} or {"series":[[1,2],[3,4]]} or [[1,2],[3,4]]
  CSV   1,2,3\\n4,5,6
  TSV   tab-separated
  NL    one number per line

Options:
  --width=N        Chart width (default: terminal width)
  --height=N       Chart height (default: 15)
  --title=STR       Chart title
  --live            Stream newline-delimited JSON/CSV and redraw per line

Examples:
  echo '[3,7,2,8,5,9,1,6]' | termalytics line
  echo '[3,7,2,8,5]' | termalytics spark
  echo '{"label":"CPU","value":72}' | termalytics gauge
  seq 1 20 | termalytics bar
`;
}
function parseArgs(argv) {
    const args = { command: "", live: false };
    for (const a of argv) {
        if (a.startsWith("--width="))
            args.width = parseInt(a.slice(8));
        else if (a.startsWith("--height="))
            args.height = parseInt(a.slice(9));
        else if (a.startsWith("--title="))
            args.title = a.slice(8);
        else if (a.startsWith("--max="))
            args.max = parseFloat(a.slice(6));
        else if (a === "--live")
            args.live = true;
        else if (a === "--help" || a === "-h") {
            console.log(help());
            process.exit(0);
        }
        else if (!a.startsWith("-"))
            args.command = a;
    }
    return args;
}
async function readStdin() {
    return new Promise((resolve) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => (data += chunk));
        process.stdin.on("end", () => resolve(data));
        // If stdin is a TTY (no pipe), exit with help
        if (process.stdin.isTTY)
            resolve("");
    });
}
function parseInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return { series: [] };
    // Try JSON first
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const j = JSON.parse(trimmed);
            if (Array.isArray(j)) {
                // [[1,2],[3,4]] → multi-series; [1,2,3] → single
                if (j.length > 0 && Array.isArray(j[0]))
                    return { series: j };
                return { series: [j] };
            }
            if (j.data)
                return { series: [j.data] };
            if (j.series)
                return { series: j.series };
            if (j.value !== undefined)
                return { series: [], single: j.value, labels: j.label ? [j.label] : undefined };
            if (j.headers && j.rows)
                return { series: [], headers: j.headers, rows: j.rows };
            if (j.matrix)
                return { series: [], matrix: j.matrix, labels: j.rowLabels, headers: j.colLabels };
        }
        catch { /* fall through to CSV */ }
    }
    // CSV/TSV/NL detection
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const sep = lines[0]?.includes("\t") ? "\t" : lines[0]?.includes(",") ? "," : null;
    if (!sep) {
        // One number per line
        const nums = lines.map(Number).filter((n) => !isNaN(n));
        return { series: [nums] };
    }
    // CSV: if all cells parse as numbers → multi-series columns
    const cells = lines.map((l) => l.split(sep).map((c) => c.trim()));
    const allNumeric = cells.every((row) => row.every((c) => !isNaN(parseFloat(c))));
    if (allNumeric) {
        // Transpose: each column becomes a series
        const maxCols = Math.max(...cells.map((r) => r.length));
        const series = [];
        for (let c = 0; c < maxCols; c++) {
            series.push(cells.map((r) => parseFloat(r[c] ?? "0")).filter((n) => !isNaN(n)));
        }
        return { series };
    }
    // Non-numeric CSV → table
    const headers = cells[0] ?? [];
    const rows = cells.slice(1);
    return { series: [], headers, rows };
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.command) {
        console.log(help());
        process.exit(0);
    }
    const w = args.width ?? process.stdout.columns ?? 80;
    const h = args.height ?? 15;
    const render = async () => {
        const raw = await readStdin();
        const parsed = parseInput(raw);
        let out = "";
        switch (args.command) {
            case "line":
                out = lineChart(parsed.series, { width: w, height: h, title: args.title, max: args.max });
                break;
            case "bar":
                if (parsed.series.length > 0 && parsed.series[0]) {
                    const data = parsed.series[0].map((v, i) => ({ label: `r${i + 1}`, value: v }));
                    out = barChart(data, { width: w, title: args.title });
                }
                break;
            case "spark":
                if (parsed.series[0])
                    out = sparkline(parsed.series[0], { width: w });
                break;
            case "gauge":
                if (parsed.single !== undefined) {
                    out = gauge(parsed.single, args.max ?? 100, { width: w, label: parsed.labels?.[0] });
                }
                break;
            case "table":
                if (parsed.headers && parsed.rows) {
                    out = table(parsed.headers, parsed.rows, { title: args.title });
                }
                break;
            case "heatmap":
                if (parsed.matrix) {
                    out = heatmap(parsed.matrix, { title: args.title, rowLabels: parsed.labels, colLabels: parsed.headers });
                }
                break;
            default:
                out = `Unknown command: ${args.command}\n${help()}`;
        }
        return out;
    };
    if (args.live) {
        // Streaming NDJSON/CSV live mode: each stdin line triggers a redraw
        let buffer = "";
        const readline = await import("node:readline");
        const rl = readline.createInterface({ input: process.stdin });
        rl.on("line", (line) => {
            buffer = line;
            const parsed = parseInput(buffer);
            const w = args.width ?? process.stdout.columns ?? 80;
            let out = "";
            switch (args.command) {
                case "line":
                    out = lineChart(parsed.series, { width: w, height: h, title: args.title, max: args.max });
                    break;
                case "bar":
                    if (parsed.series[0])
                        out = barChart(parsed.series[0].map((v, i) => ({ label: `r${i + 1}`, value: v })), { width: w, title: args.title });
                    break;
                case "spark":
                    if (parsed.series[0])
                        out = sparkline(parsed.series[0], { width: w });
                    break;
                case "gauge":
                    if (parsed.single !== undefined)
                        out = gauge(parsed.single, args.max ?? 100, { width: w, label: parsed.labels?.[0] });
                    break;
                case "table":
                    if (parsed.headers && parsed.rows)
                        out = table(parsed.headers, parsed.rows, { title: args.title });
                    break;
                case "heatmap":
                    if (parsed.matrix)
                        out = heatmap(parsed.matrix, { title: args.title, rowLabels: parsed.labels, colLabels: parsed.headers });
                    break;
            }
            process.stdout.write(`\x1b[H\x1b[2J${out}\n`);
        });
    }
    else {
        const out = await render();
        console.log(out);
    }
}
main();
