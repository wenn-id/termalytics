/**
 * Braille-based pixel canvas for high-resolution terminal drawing.
 * Each braille cell encodes a 2-wide × 4-tall pixel grid (8 pixels per char).
 * @module core/canvas
 */
/**
 * A 2D pixel canvas backed by braille characters.
 * `width` and `height` are in pixels.
 * The canvas renders to `ceil(width/2)` columns × `ceil(height/4)` rows of text.
 */
export declare class BrailleCanvas {
    readonly width: number;
    readonly height: number;
    private cells;
    constructor(width: number, height: number);
    /** Number of text columns the canvas occupies. */
    get textCols(): number;
    /** Number of text rows the canvas occupies. */
    get textRows(): number;
    /** Set a single pixel. Out-of-bounds is ignored. */
    set(x: number, y: number, value?: number): void;
    /** Get a single pixel (0 or 1). */
    get(x: number, y: number): number;
    /** Toggle a pixel. */
    toggle(x: number, y: number): void;
    /** Clear all pixels. */
    clear(): void;
    /** Draw a line using Bresenham's algorithm. */
    line(x0: number, y0: number, x1: number, y1: number, value?: number): void;
    /**
     * Draw a connected polyline through the given points.
     * Points is an array of [x, y] tuples.
     */
    polyline(points: Array<[number, number]>): void;
    /** Fill a rectangular region. */
    rect(x: number, y: number, w: number, h: number, value?: number): void;
    /** Set a filled point (single pixel, same as set). */
    point(x: number, y: number): void;
    /**
     * Render the canvas to a string of braille characters.
     * Each row is separated by a newline.
     */
    render(): string;
    /**
     * Render the canvas, prefixed with cursor positioning for live updates.
     * `startRow` and `startCol` are 1-indexed terminal coordinates.
     */
    renderAt(startRow: number, startCol: number): string;
    private cellsToString;
}
