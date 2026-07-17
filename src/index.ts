/**
 * Termalytics — zero-dependency terminal dataviz library.
 * Public API re-exports.
 * @module termalytics
 */

// Core
export { Color, style, wrap, rgb, bgRgb, stripAnsi, visibleWidth, pad, truncate } from "./core/ansi.js";
export { BrailleCanvas } from "./core/canvas.js";
export { Scale, niceTicks, logTicks, formatTick } from "./core/scale.js";
export type { ScaleOptions, ScaleType } from "./core/scale.js";
export { liveScreen, termSize } from "./core/screen.js";

// Widgets
export { lineChart, barChart, sparkline, gauge, table, heatmap } from "./widgets/chart.js";
export type { ChartOptions, SeriesStyle } from "./widgets/chart.js";
export { panel, grid, stack } from "./widgets/layout.js";
export type { PanelOptions, GridOptions } from "./widgets/layout.js";
