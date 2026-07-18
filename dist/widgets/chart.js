/**
 * Widget: Chart — line/area, bar, sparkline, gauge, table, heatmap.
 * Each function returns a rendered string (rows joined by "\n").
 * @module widgets/chart
 */
import { Scale, formatTick } from "../core/scale.js";
import { BrailleCanvas } from "../core/canvas.js";
import { style, stripAnsi, wrap, pad } from "../core/ansi.js";
const DEFAULT_COLORS = [
    36 /* Color.Cyan */, 32 /* Color.Green */, 33 /* Color.Yellow */, 31 /* Color.Red */, 35 /* Color.Magenta */,
    96 /* Color.BrightCyan */, 92 /* Color.BrightGreen */, 93 /* Color.BrightYellow */, 91 /* Color.BrightRed */, 95 /* Color.BrightMagenta */,
];
function seriesColor(idx, opts) {
    return opts.series?.[idx]?.color ?? opts.colors?.[idx] ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
}
function seriesLabel(idx, opts) {
    return opts.series?.[idx]?.label ?? `Series ${idx + 1}`;
}
function computeBounds(dataSeries, opts) {
    let lo = opts.min ?? Infinity;
    let hi = opts.max ?? -Infinity;
    if (opts.min === undefined || opts.max === undefined) {
        for (const series of dataSeries) {
            for (const v of series) {
                if (!Number.isFinite(v))
                    continue;
                if (opts.min === undefined)
                    lo = Math.min(lo, v);
                if (opts.max === undefined)
                    hi = Math.max(hi, v);
            }
        }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi))
        return [0, 1];
    if (lo === hi)
        return [lo - 1, hi + 1];
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
export function lineChart(dataSeries, opts = {}) {
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
        if (series.length < 1)
            continue;
        const xScale = new Scale({ domain: [0, Math.max(1, series.length - 1)], range: [0, pxW - 1] });
        const points = [];
        for (let i = 0; i < series.length; i++) {
            const v = series[i];
            if (!Number.isFinite(v))
                continue;
            const px = Math.round(xScale.map(i));
            const py = pxH - 1 - Math.round(yScale.map(v));
            points.push([px, py]);
        }
        if (points.length === 1) {
            canvas.set(points[0][0], points[0][1]);
        }
        else {
            canvas.polyline(points);
        }
    }
    const canvasLines = canvas.render().split("\n");
    // Build y-axis labels aligned to text rows
    const yTicks = new Scale({ type: yScaleType, domain: [yMin, yMax], range: [0, pxH - 1] }).ticks(Math.min(6, plotRows));
    const rowLabels = new Map();
    for (const tick of yTicks) {
        const py = pxH - 1 - Math.round(yScale.map(tick));
        const textRow = Math.floor(py / 4);
        if (textRow >= 0 && textRow < plotRows) {
            rowLabels.set(textRow, formatTick(tick));
        }
    }
    const out = [];
    if (opts.title)
        out.push(wrap(` ${opts.title}`, 1 /* Color.Bold */, 97 /* Color.BrightWhite */));
    if (dataSeries.length > 1) {
        out.push("  " + dataSeries.map((_, i) => wrap(`● ${seriesLabel(i, opts)}`, seriesColor(i, opts))).join("  "));
    }
    for (let r = 0; r < plotRows; r++) {
        const label = showAxis ? wrap(pad(rowLabels.get(r) ?? "", labelW - 1, "right") + "┤", 2 /* Color.Dim */) : "";
        // Single-series: colorize whole plot; multi-series: leave default (braille can't per-series color)
        const cellLine = canvasLines[r] ?? "";
        const colored = dataSeries.length === 1 ? wrap(cellLine, seriesColor(0, opts)) : cellLine;
        out.push(label + colored);
    }
    // X-axis baseline
    if (showAxis) {
        out.push(wrap(" ".repeat(labelW - 1) + "└" + "─".repeat(plotCols), 2 /* Color.Dim */));
    }
    return out.join("\n");
}
/**
 * Horizontal bar chart. `data` is {label, value} objects or bare numbers.
 */
export function barChart(data, opts = {}) {
    const width = opts.width ?? 60;
    const items = data.map((d, i) => typeof d === "number" ? { label: String(i), value: d } : { label: d.label, value: d.value });
    if (items.length === 0)
        return "[No data]";
    const labelW = Math.min(20, Math.max(...items.map(i => i.label.length)));
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)).filter(Number.isFinite), 1);
    const barSpace = Math.max(4, width - labelW - 10);
    const barColor = opts.series?.[0]?.color ?? opts.colors?.[0] ?? 36 /* Color.Cyan */;
    const lines = [];
    if (opts.title)
        lines.push(wrap(` ${opts.title}`, 1 /* Color.Bold */, 97 /* Color.BrightWhite */));
    for (const item of items) {
        const label = pad(item.label, labelW, "right");
        const absVal = Math.abs(item.value);
        const exact = (absVal / maxVal) * barSpace;
        const barLen = Math.floor(exact);
        const color = item.value >= 0 ? barColor : 31 /* Color.Red */;
        // Fractional bar tip using left 1/8 block chars (▏▎▍▌▋▊▉)
        const frac = exact - Math.floor(exact);
        const tip = frac > 0.1 ? String.fromCharCode(0x258F - Math.min(Math.round(frac * 7), 6)) : "";
        const bar = wrap("█".repeat(barLen) + tip, color);
        const valStr = wrap(` ${item.value}`, 97 /* Color.BrightWhite */);
        lines.push(`${label} ${bar}${valStr}`);
    }
    return lines.join("\n");
}
/**
 * Sparkline: compact inline chart via 8-level block characters.
 */
export function sparkline(data, opts = {}) {
    if (data.length === 0)
        return "";
    const width = opts.width ?? Math.min(data.length, 80);
    const color = opts.color ?? 36 /* Color.Cyan */;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = data.length / width;
    const chars = [];
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
export function gauge(value, maxValue, opts = {}) {
    const w = Math.max(1, Math.floor(opts.width ?? 30));
    const ratio = maxValue > 0 ? Math.min(1, Math.max(0, value / maxValue)) : 0;
    const filled = Math.round(ratio * w);
    const color = opts.color ?? (ratio > 0.9 ? 31 /* Color.Red */ : ratio > 0.7 ? 33 /* Color.Yellow */ : 32 /* Color.Green */);
    const bar = wrap("█".repeat(filled), color) + wrap("░".repeat(w - filled), 2 /* Color.Dim */);
    const pct = (ratio * 100).toFixed(1);
    return `${opts.label ? opts.label + " " : ""}[${bar}] ${wrap(pct + "%", 97 /* Color.BrightWhite */, 1 /* Color.Bold */)}`;
}
/**
 * Table widget: render rows as a bordered table using box-drawing chars.
 */
export function table(headers, rows, opts = {}) {
    if (headers.length === 0)
        return "";
    const colW = headers.map((h, i) => {
        let max = stripAnsi(h).length;
        for (const row of rows)
            if (row[i])
                max = Math.max(max, stripAnsi(row[i]).length);
        return max + 2;
    });
    const border = (l, m, r) => wrap(l + colW.map(w => "─".repeat(w)).join(m) + r, 2 /* Color.Dim */);
    const lines = [];
    if (opts.title)
        lines.push(wrap(` ${opts.title}`, 1 /* Color.Bold */, 97 /* Color.BrightWhite */));
    lines.push(border("┌", "┬", "┐"));
    const hdrColor = opts.headerColor ?? 97 /* Color.BrightWhite */;
    lines.push(wrap("│", 2 /* Color.Dim */) +
        headers.map((h, i) => " " + wrap(pad(h, colW[i] - 2, "left"), 1 /* Color.Bold */, hdrColor) + " ").join(wrap("│", 2 /* Color.Dim */)) +
        wrap("│", 2 /* Color.Dim */));
    lines.push(border("├", "┼", "┤"));
    for (const row of rows) {
        lines.push(wrap("│", 2 /* Color.Dim */) +
            headers.map((_, i) => {
                const align = opts.align?.[i] ?? "left";
                return " " + pad(row[i] ?? "", colW[i] - 2, align) + " ";
            }).join(wrap("│", 2 /* Color.Dim */)) +
            wrap("│", 2 /* Color.Dim */));
    }
    lines.push(border("└", "┴", "┘"));
    return lines.join("\n");
}
/**
 * Heatmap: render a 2D numeric grid as truecolor cells (blue→red).
 */
export function heatmap(matrix, opts = {}) {
    if (matrix.length === 0 || (matrix[0]?.length ?? 0) === 0)
        return "";
    const rows = matrix.length;
    const cols = matrix[0].length;
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of matrix)
        for (const v of row) {
            if (v < minVal)
                minVal = v;
            if (v > maxVal)
                maxVal = v;
        }
    const range = maxVal - minVal || 1;
    const cf = opts.colorFn ?? ((ratio) => {
        const r = Math.round(ratio * 255);
        const b = Math.round((1 - ratio) * 255);
        return `\x1b[48;2;${r};30;${b}m`;
    });
    const labelW = opts.rowLabels ? Math.max(...opts.rowLabels.map(l => l.length), 3) : 3;
    const lines = [];
    if (opts.title)
        lines.push(wrap(` ${opts.title}`, 1 /* Color.Bold */, 97 /* Color.BrightWhite */));
    if (opts.colLabels) {
        let hdr = " ".repeat(labelW + 1);
        for (let c = 0; c < cols; c++)
            hdr += pad(opts.colLabels[c] ?? "", 4, "center");
        lines.push(wrap(hdr, 2 /* Color.Dim */));
    }
    for (let r = 0; r < rows; r++) {
        let line = pad(opts.rowLabels?.[r] ?? String(r), labelW, "right") + " ";
        for (let c = 0; c < cols; c++) {
            const ratio = (matrix[r][c] - minVal) / range;
            const cell = pad(matrix[r][c].toFixed(0), 4, "center");
            line += cf(ratio) + wrap(cell, 97 /* Color.BrightWhite */) + style(0 /* Color.Reset */);
        }
        lines.push(line);
    }
    return lines.join("\n");
}
