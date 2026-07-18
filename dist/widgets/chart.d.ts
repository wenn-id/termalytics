/**
 * Widget: Chart — line/area, bar, sparkline, gauge, table, heatmap.
 * Each function returns a rendered string (rows joined by "\n").
 * @module widgets/chart
 */
import type { ScaleOptions } from "../core/scale.js";
/** Per-series styling for chart lines/points. */
export interface SeriesStyle {
    color?: number;
    label?: string;
}
export interface ChartOptions {
    /** Plot area width in text columns (default 80). */
    width?: number;
    /** Plot area height in text rows (default 15). */
    height?: number;
    title?: string;
    showAxis?: boolean;
    min?: number;
    max?: number;
    scale?: ScaleOptions;
    series?: SeriesStyle[];
    colors?: number[];
}
/**
 * Braille line/area chart. Multiple series supported.
 * Each series is an array of numbers. Returns rendered text rows.
 */
export declare function lineChart(dataSeries: number[][], opts?: ChartOptions): string;
/**
 * Horizontal bar chart. `data` is {label, value} objects or bare numbers.
 */
export declare function barChart(data: Array<{
    label: string;
    value: number;
} | number>, opts?: ChartOptions): string;
/**
 * Sparkline: compact inline chart via 8-level block characters.
 */
export declare function sparkline(data: number[], opts?: {
    width?: number;
    color?: number;
}): string;
/**
 * Gauge / progress bar. Returns a single line.
 */
export declare function gauge(value: number, maxValue: number, opts?: {
    width?: number;
    label?: string;
    color?: number;
}): string;
/**
 * Table widget: render rows as a bordered table using box-drawing chars.
 */
export declare function table(headers: string[], rows: string[][], opts?: {
    headerColor?: number;
    title?: string;
    align?: Array<"left" | "right">;
}): string;
/**
 * Heatmap: render a 2D numeric grid as truecolor cells (blue→red).
 */
export declare function heatmap(matrix: number[][], opts?: {
    title?: string;
    rowLabels?: string[];
    colLabels?: string[];
    colorFn?: (ratio: number) => string;
}): string;
