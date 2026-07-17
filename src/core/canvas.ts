/**
 * Braille-based pixel canvas for high-resolution terminal drawing.
 * Each braille cell encodes a 2-wide × 4-tall pixel grid (8 pixels per char).
 * @module core/canvas
 */

import { cursorTo } from "./ansi.js";

/**
 * Braille dot bit positions (Unicode U+2800..U+28FF).
 * The base char U+2800 is blank; each bit adds a dot:
 *
 *  .  .    dot 1 (0x01)  dot 4 (0x08)
 *  .  .    dot 2 (0x02)  dot 5 (0x10)
 *  .  .    dot 3 (0x04)  dot 6 (0x20)
 *  .  .    dot 7 (0x40)  dot 8 (0x80)
 *
 *  (left column)          (right column)
 *
 * So char width = 2 pixels, char height = 4 pixels.
 */
const BRAILLE_BASE = 0x2800;

// Bitmask lookup: (x % 2, y % 4) -> bit value
const DOT_MAP: number[][] = [
  [0x01, 0x02, 0x04, 0x40], // x=0, y=0..3
  [0x08, 0x10, 0x20, 0x80], // x=1, y=0..3
];

/**
 * A 2D pixel canvas backed by braille characters.
 * `width` and `height` are in pixels.
 * The canvas renders to `ceil(width/2)` columns × `ceil(height/4)` rows of text.
 */
export class BrailleCanvas {
  readonly width: number;
  readonly height: number;
  private cells: Uint8Array;

  constructor(width: number, height: number) {
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
    const cols = Math.ceil(this.width / 2);
    const rows = Math.ceil(this.height / 4);
    this.cells = new Uint8Array(cols * rows);
  }

  /** Number of text columns the canvas occupies. */
  get textCols(): number {
    return Math.ceil(this.width / 2);
  }

  /** Number of text rows the canvas occupies. */
  get textRows(): number {
    return Math.ceil(this.height / 4);
  }

  /** Set a single pixel. Out-of-bounds is ignored. */
  set(x: number, y: number, value = 1): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    x = Math.floor(x);
    y = Math.floor(y);
    const col = Math.floor(x / 2);
    const row = Math.floor(y / 4);
    const idx = row * this.textCols + col;
    const bit = DOT_MAP[x % 2][y % 4];
    if (value) {
      this.cells[idx] |= bit;
    } else {
      this.cells[idx] &= ~bit;
    }
  }

  /** Get a single pixel (0 or 1). */
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    x = Math.floor(x);
    y = Math.floor(y);
    const col = Math.floor(x / 2);
    const row = Math.floor(y / 4);
    const idx = row * this.textCols + col;
    const bit = DOT_MAP[x % 2][y % 4];
    return (this.cells[idx] & bit) ? 1 : 0;
  }

  /** Toggle a pixel. */
  toggle(x: number, y: number): void {
    this.set(x, y, this.get(x, y) ? 0 : 1);
  }

  /** Clear all pixels. */
  clear(): void {
    this.cells.fill(0);
  }

  /** Draw a line using Bresenham's algorithm. */
  line(x0: number, y0: number, x1: number, y1: number, value = 1): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    // Safety limit to prevent infinite loops
    const maxSteps = (dx + dy + 2) * 2;
    let steps = 0;

    while (steps++ < maxSteps) {
      this.set(x0, y0, value);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Draw a connected polyline through the given points.
   * Points is an array of [x, y] tuples.
   */
  polyline(points: Array<[number, number]>): void {
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      this.line(x0, y0, x1, y1);
    }
  }

  /** Fill a rectangular region. */
  rect(x: number, y: number, w: number, h: number, value = 1): void {
    const x2 = Math.min(x + w, this.width);
    const y2 = Math.min(y + h, this.height);
    for (let py = Math.max(0, Math.floor(y)); py < y2; py++) {
      for (let px = Math.max(0, Math.floor(x)); px < x2; px++) {
        this.set(px, py, value);
      }
    }
  }

  /** Set a filled point (single pixel, same as set). */
  point(x: number, y: number): void {
    this.set(x, y, 1);
  }

  /**
   * Render the canvas to a string of braille characters.
   * Each row is separated by a newline.
   */
  render(): string {
    const cols = this.textCols;
    const rows = this.textRows;
    if (cols === 0 || rows === 0) return "";
    const lines: string[] = [];
    for (let row = 0; row < rows; row++) {
      let line = "";
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        line += String.fromCharCode(BRAILLE_BASE + this.cells[idx]);
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  /**
   * Render the canvas, prefixed with cursor positioning for live updates.
   * `startRow` and `startCol` are 1-indexed terminal coordinates.
   */
  renderAt(startRow: number, startCol: number): string {
    const cols = this.textCols;
    const rows = this.textRows;
    if (cols === 0 || rows === 0) return "";
    const lines: string[] = [];
    for (let row = 0; row < rows; row++) {
      lines.push(cursorTo(startRow + row, startCol) + this.cellsToString(row, cols));
    }
    return lines.join("");
  }

  private cellsToString(row: number, cols: number): string {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      line += String.fromCharCode(BRAILLE_BASE + this.cells[idx]);
    }
    return line;
  }
}
