/**
 * Layout: compose multiple charts/panels into a terminal dashboard.
 * Supports grid layout (rows × cols).
 * @module widgets/layout
 */
/** A panel is a bordered section containing rendered content. */
export interface PanelOptions {
    title?: string;
    width?: number;
    height?: number;
    border?: boolean;
    borderColor?: number;
    paddingX?: number;
    paddingY?: number;
}
/**
 * Render a single panel with border, title, and content.
 * `content` is pre-rendered text (each line is one row).
 */
export declare function panel(content: string[], opts?: PanelOptions): string;
/**
 * Layout options for grid composition.
 */
export interface GridOptions {
    columns: number;
    width: number;
    gap?: number;
    equal?: boolean;
}
/**
 * Arrange panels in a grid.
 * `cells` is an array of pre-rendered panel content strings (each multi-line).
 * Returns a single string with the grid layout.
 */
export declare function grid(cells: string[], opts: GridOptions): string;
/**
 * Stack panels vertically (vertical layout).
 */
export declare function stack(panels: string[], opts?: {
    gap?: number;
}): string;
