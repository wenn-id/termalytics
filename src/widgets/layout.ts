/**
 * Layout: compose multiple charts/panels into a terminal dashboard.
 * Supports grid layout (rows × cols).
 * @module widgets/layout
 */

import { Color, wrap, style, stripAnsi, pad, truncate } from "../core/ansi.js";

/** A panel is a bordered section containing rendered content. */
export interface PanelOptions {
  title?: string;
  width?: number;       // Width in text columns (default: auto fill available)
  height?: number;      // Height in text rows (default: content height)
  border?: boolean;     // Default: true
  borderColor?: number;
  paddingX?: number;    // Horizontal padding (default: 1)
  paddingY?: number;    // Vertical padding (default: 0)
}

/**
 * Render a single panel with border, title, and content.
 * `content` is pre-rendered text (each line is one row).
 */
export function panel(content: string[], opts: PanelOptions = {}): string {
  const border = opts.border ?? true;
  const borderColor = opts.borderColor ?? Color.Dim;
  const padX = opts.paddingX ?? 1;
  const padY = opts.paddingY ?? 0;

  // Measure content
  const maxLineLen = Math.max(...content.map(l => stripAnsi(l).length), 1);
  const contentHeight = content.length;

  if (!border) {
    // No border: just return content with padding
    const spacer = " ".repeat(padX);
    const lines: string[] = [];
    // Top padding
    for (let i = 0; i < padY; i++) lines.push("");
    for (const line of content) {
      lines.push(spacer + line + spacer);
    }
    for (let i = 0; i < padY; i++) lines.push("");
    return lines.join("\n");
  }

  const innerW = maxLineLen + padX * 2;
  const bottomLine = wrap(`└${"─".repeat(innerW)}┘`, borderColor);
  const sideBar = wrap("│", borderColor);

  const titleText = opts.title ?? "";
  const titleLen = stripAnsi(titleText).length;

  let topLine: string;
  if (titleText) {
    const lhsLen = Math.floor((innerW - titleLen - 2) / 2);
    const rhsLen = innerW - titleLen - 2 - lhsLen;
    topLine = wrap(`┌─${"─".repeat(lhsLen)} ${wrap(titleText, Color.Bold)} ${"─".repeat(rhsLen)}─┐`, borderColor);
  } else {
    topLine = wrap(`┌${"─".repeat(innerW)}┐`, borderColor);
  }

  const lines: string[] = [topLine];
  const spacerRow = sideBar + " ".repeat(innerW) + sideBar;

  for (let i = 0; i < padY; i++) lines.push(spacerRow);
  for (const line of content) {
    const padded = pad(line, innerW - padX * 2);
    lines.push(sideBar + " ".repeat(padX) + padded + " ".repeat(padX) + sideBar);
  }
  for (let i = 0; i < padY; i++) lines.push(spacerRow);
  lines.push(bottomLine);

  return lines.join("\n");
}

/**
 * Layout options for grid composition.
 */
export interface GridOptions {
  columns: number;        // Number of columns
  width: number;          // Total width in text columns
  gap?: number;           // Gap between cells (default: 1)
  equal?: boolean;        // Equal width columns (default: true)
}

/**
 * Arrange panels in a grid.
 * `cells` is an array of pre-rendered panel content strings (each multi-line).
 * Returns a single string with the grid layout.
 */
export function grid(cells: string[], opts: GridOptions): string {
  const cols = Math.min(opts.columns, cells.length);
  const gap = opts.gap ?? 1;
  const totalW = opts.width;
  if (cols === 0) return "";

  const cellLines = cells.map(c => c.split("\n"));
  const maxH = Math.max(...cellLines.map(l => l.length));
  const colW = Math.floor((totalW - gap * (cols - 1)) / cols);

  // Pad each cell to maxH rows and colW columns
  const paddedCells = cellLines.map((lines) => {
    const padded = lines.map(l => pad(l, colW));
    while (padded.length < maxH) padded.push(" ".repeat(colW));
    return padded;
  });

  // Number of cell-rows (rows of panels)
  const cellRows = Math.ceil(paddedCells.length / cols);
  const gapStr = " ".repeat(gap);
  const result: string[] = [];

  for (let cr = 0; cr < cellRows; cr++) {
    for (let row = 0; row < maxH; row++) {
      const parts: string[] = [];
      for (let ci = 0; ci < cols; ci++) {
        const cellIdx = cr * cols + ci;
        if (cellIdx < paddedCells.length) {
          parts.push(paddedCells[cellIdx]![row] ?? " ".repeat(colW));
        } else {
          parts.push(" ".repeat(colW));
        }
      }
      result.push(parts.join(gapStr));
    }
  }

  return result.join("\n");
}

/**
 * Stack panels vertically (vertical layout).
 */
export function stack(panels: string[], opts: { gap?: number } = {}): string {
  return panels.join("\n".repeat((opts.gap ?? 1)));
}
