/**
 * Widget: Chart — line/area, bar, sparkline, gauge, table, heatmap.
 * Each function returns a rendered string (rows joined by "\n").
 * @module widgets/chart
 */

import type { ScaleOptions } from "../core/scale.js";
import { Scale, formatTick } from "../core/scale.js";
import { BrailleCanvas } from "../core/canvas.js";
import { Color, style, stripAnsi, wrap, pad } from "../core/ansi.js";

/** Per-series styling for chart lines/points. */
export interface SeriesStyle {
  color?: number; // ANSI Color (default cycles through palette)
  label?: string;
}

export interface ChartOptions {
  /** Plot area width in text columns (default 80). */
  width?: number;
  /** Plot area height in text rows (default 15). */
  height?: number;
  title?: string;
  showAxis?: boolean; // Show y-axis labels + border (default true)
  min?: number;
  max?: number;
  scale?: ScaleOptions;
  series?: SeriesStyle[];
  colors?: number[];
}

const DEFAULT_COLORS: number[] = [
  Color.Cyan, Color.Green, Color.Yellow, Color.Red, Color.Magenta,
  Color.BrightCyan, Color.BrightGreen, Color.BrightYellow, Color.BrightRed, Color.BrightMagenta,
];

function seriesColor(idx: number, opts: ChartOptions): number {
  return opts.series?.[idx]?.color ?? opts.colors?.[idx] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}

function seriesLabel(idx: number, opts: ChartOptions): string {
  return opts.series?.[idx]?.label ?? `Series ${idx + 1}`;
}

function computeBounds(dataSeries: number[][], opts: ChartOptions): [number, number] {
  let lo = opts.min ?? Infinity;
  let hi = opts.max ?? -Infinity;
  if (opts.min === undefined || opts.max === undefined) {
    for (const series of dataSeries) {
      for (const v of series) {
        if (!Number.isFinite(v)) continue;
        if (opts.min === undefined) lo = Math.min(lo, v);
        if (opts.max === undefined) hi = Math.max(hi, v);
      }
    }
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) return [lo - 1, hi + 1];
  // 8% headroom so peaks aren't clipped to the border
  const padY = (hi - lo) * 0.08;
  return [
    opts.min !== undefined ? opts.min : lo - padY,
    opts.max !== undefined ? opts.max : hi + padY,
  ];
}

/**
 * Braille line/area chart. Multiple series supported.
 * Each series is an array of numbers. Returns rendered text rows.
 */
export function lineChart(dataSeries: number[][], opts: ChartOptions = {}): string {
  const textCols = opts.width ?? 80;
  const textRows = opts.height ?? 15;
  const showAxis = opts.showAxis ?? true;

  const [yMin, yMax] = computeBounds(dataSeries, opts);
  const yScaleType = opts.scale?.type ?? "linear";

  // Reserve columns for y-axis labels
  const labelW = showAxis ? 8 : 0;
  const plotCols = Math.max(2, textCols - labelW);
  const plotRows = Math.max(2, textRows);

  // Braille pixels: 2 per col, 4 per row
  const pxW = plotCols * 2;
  const pxH = plotRows * 4;

  const canvas = new BrailleCanvas(pxW, pxH);
  const yScale = new Scale({ type: yScaleType, domain: [yMin, yMax], range: [0, pxH - 1] });

  for (let si = 0; si < dataSeries.length; si++) {
    const series = dataSeries[si];
    if (series.length < 1) continue;
    const xScale = new Scale({ domain: [0, Math.max(1, series.length - 1)], range: [0, pxW - 1] });
    const points: Array<[number, number]> = [];
    for (let i = 0; i < series.length; i++) {
      const v = series[i];
      if (!Number.isFinite(v)) continue;
      const px = Math.round(xScale.map(i));
      const py = pxH - 1 - Math.round(yScale.map(v));
      points.push([px, py]);
    }
    if (points.length === 1) {
      canvas.set(points[0][0], points[0][1]);
    } else {
      canvas.polyline(points);
    }
  }

  const canvasLines = canvas.render().split("\n");

  // Build y-axis labels aligned to text rows
  const yTicks = new Scale({ type: yScaleType, domain: [yMin, yMax], range: [0, pxH - 1] }).ticks(Math.min(6, plotRows));
  const rowLabels = new Map<number, string>();
  for (const tick of yTicks) {
    const py = pxH - 1 - Math.round(yScale.map(tick));
    const textRow = Math.floor(py / 4);
    if (textRow >= 0 && textRow < plotRows) {
      rowLabels.set(textRow, formatTick(tick));
    }
  }

  const out: string[] = [];
  if (opts.title) out.push(wrap(` ${opts.title}`, Color.Bold, Color.BrightWhite));
  if (dataSeries.length > 1) {
    out.push("  " + dataSeries.map((_, i) => wrap(`● ${seriesLabel(i, opts)}`, seriesColor(i, opts))).join("  "));
  }

  for (let r = 0; r < plotRows; r++) {
    const label = showAxis ? wrap(pad(rowLabels.get(r) ?? "", labelW - 1, "right") + "┤", Color.Dim) : "";
    // Single-series: colorize whole plot; multi-series: leave default (braille can't per-series color)
    const cellLine = canvasLines[r] ?? "";
    const colored = dataSeries.length === 1 ? wrap(cellLine, seriesColor(0, opts)) : cellLine;
    out.push(label + colored);
  }

  // X-axis baseline
  if (showAxis) {
    out.push(wrap(" ".repeat(labelW - 1) + "└" + "─".repeat(plotCols), Color.Dim));
  }

  return out.join("\n");
}

/**
 * Horizontal bar chart. `data` is {label, value} objects or bare numbers.
 */
export function barChart(
  data: Array<{ label: string; value: number } | number>,
  opts: ChartOptions = {},
): string {
  const width = opts.width ?? 60;
  const items = data.map((d, i) =>
    typeof d === "number" ? { label: String(i), value: d } : { label: d.label, value: d.value },
  );
  if (items.length === 0) return "[No data]";

  const labelW = Math.min(20, Math.max(...items.map(i => i.label.length)));
  const maxVal = Math.max(...items.map(i => Math.abs(i.value)).filter(Number.isFinite), 1);
  const barSpace = Math.max(4, width - labelW - 10);

  const barColor = opts.series?.[0]?.color ?? opts.colors?.[0] ?? Color.Cyan;

  const lines: string[] = [];
  if (opts.title) lines.push(wrap(` ${opts.title}`, Color.Bold, Color.BrightWhite));

  for (const item of items) {
    const label = pad(item.label, labelW, "right");
    const absVal = Math.abs(item.value);
    const exact = (absVal / maxVal) * barSpace;
    const barLen = Math.floor(exact);
    const color = item.value >= 0 ? barColor : Color.Red;
    // Fractional bar tip using left 1/8 block chars (▏▎▍▌▋▊▉)
    const frac = exact - Math.floor(exact);
    const tip = frac > 0.1 ? String.fromCharCode(0x258F - Math.min(Math.round(frac * 7), 6)) : "";
    const bar = wrap("█".repeat(barLen) + tip, color);
    const valStr = wrap(` ${item.value}`, Color.BrightWhite);
    lines.push(`${label} ${bar}${valStr}`);
  }

  return lines.join("\n");
}

/**
 * Sparkline: compact inline chart via 8-level block characters.
 */
export function sparkline(data: number[], opts: { width?: number; color?: number } = {}): string {
  if (data.length === 0) return "";
  const width = opts.width ?? Math.min(data.length, 80);
  const color = opts.color ?? Color.Cyan;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length / width;

  const chars: string[] = [];
  for (let i = 0; i < width; i++) {
    const idx = Math.min(Math.floor(i * step), data.length - 1);
    const norm = (data[idx] - min) / range;
    const level = Math.round(norm * 7);
    chars.push(String.fromCharCode(0x2581 + Math.min(Math.max(level, 0), 7)));
  }
  return wrap(chars.join(""), color);
}

/**
 * Gauge / progress bar. Returns a single line.
 */
export function gauge(
  value: number,
  maxValue: number,
  opts: { width?: number; label?: string; color?: number } = {},
): string {
  const w = Math.max(1, Math.floor(opts.width ?? 30));
  const ratio = maxValue > 0 ? Math.min(1, Math.max(0, value / maxValue)) : 0;
  const filled = Math.round(ratio * w);
  const color = opts.color ?? (ratio > 0.9 ? Color.Red : ratio > 0.7 ? Color.Yellow : Color.Green);
  const bar = wrap("█".repeat(filled), color) + wrap("░".repeat(w - filled), Color.Dim);
  const pct = (ratio * 100).toFixed(1);
  return `${opts.label ? opts.label + " " : ""}[${bar}] ${wrap(pct + "%", Color.BrightWhite, Color.Bold)}`;
}

/**
 * Table widget: render rows as a bordered table using box-drawing chars.
 */
export function table(
  headers: string[],
  rows: string[][],
  opts: { headerColor?: number; title?: string; align?: Array<"left" | "right"> } = {},
): string {
  if (headers.length === 0) return "";

  const colW = headers.map((h, i) => {
    let max = stripAnsi(h).length;
    for (const row of rows) if (row[i]) max = Math.max(max, stripAnsi(row[i]!).length);
    return max + 2;
  });

  const border = (l: string, m: string, r: string) =>
    wrap(l + colW.map(w => "─".repeat(w)).join(m) + r, Color.Dim);

  const lines: string[] = [];
  if (opts.title) lines.push(wrap(` ${opts.title}`, Color.Bold, Color.BrightWhite));

  lines.push(border("┌", "┬", "┐"));

  const hdrColor = opts.headerColor ?? Color.BrightWhite;
  lines.push(
    wrap("│", Color.Dim) +
      headers.map((h, i) => " " + wrap(pad(h, colW[i]! - 2, "left"), Color.Bold, hdrColor) + " ").join(wrap("│", Color.Dim)) +
      wrap("│", Color.Dim),
  );

  lines.push(border("├", "┼", "┤"));

  for (const row of rows) {
    lines.push(
      wrap("│", Color.Dim) +
        headers.map((_, i) => {
          const align = opts.align?.[i] ?? "left";
          return " " + pad(row[i] ?? "", colW[i]! - 2, align) + " ";
        }).join(wrap("│", Color.Dim)) +
        wrap("│", Color.Dim),
    );
  }

  lines.push(border("└", "┴", "┘"));
  return lines.join("\n");
}

/**
 * Heatmap: render a 2D numeric grid as truecolor cells (blue→red).
 */
export function heatmap(
  matrix: number[][],
  opts: {
    title?: string;
    rowLabels?: string[];
    colLabels?: string[];
    colorFn?: (ratio: number) => string;
  } = {},
): string {
  if (matrix.length === 0 || (matrix[0]?.length ?? 0) === 0) return "";
  const rows = matrix.length;
  const cols = matrix[0]!.length;

  let minVal = Infinity;
  let maxVal = -Infinity;
  for (const row of matrix) for (const v of row) {
    if (v < minVal) minVal = v;
    if (v > maxVal) maxVal = v;
  }
  const range = maxVal - minVal || 1;

  const cf = opts.colorFn ?? ((ratio: number) => {
    const r = Math.round(ratio * 255);
    const b = Math.round((1 - ratio) * 255);
    return `\x1b[48;2;${r};30;${b}m`;
  });

  const labelW = opts.rowLabels ? Math.max(...opts.rowLabels.map(l => l.length), 3) : 3;
  const lines: string[] = [];
  if (opts.title) lines.push(wrap(` ${opts.title}`, Color.Bold, Color.BrightWhite));

  if (opts.colLabels) {
    let hdr = " ".repeat(labelW + 1);
    for (let c = 0; c < cols; c++) hdr += pad(opts.colLabels[c] ?? "", 4, "center");
    lines.push(wrap(hdr, Color.Dim));
  }

  for (let r = 0; r < rows; r++) {
    let line = pad(opts.rowLabels?.[r] ?? String(r), labelW, "right") + " ";
    for (let c = 0; c < cols; c++) {
      const ratio = (matrix[r]![c] - minVal) / range;
      const cell = pad(matrix[r]![c].toFixed(0), 4, "center");
      line += cf(ratio) + wrap(cell, Color.BrightWhite) + style(Color.Reset);
    }
    lines.push(line);
  }

  return lines.join("\n");
}
