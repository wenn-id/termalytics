/**
 * ANSI escape codes and styling helpers.
 * Zero-dependency. No external color library.
 * @module core/ansi
 */
export declare const enum Color {
    Reset = 0,
    Bold = 1,
    Dim = 2,
    Italic = 3,
    Underline = 4,
    Blink = 5,
    Invert = 7,
    Hidden = 8,
    Black = 30,
    Red = 31,
    Green = 32,
    Yellow = 33,
    Blue = 34,
    Magenta = 35,
    Cyan = 36,
    White = 37,
    BrightBlack = 90,
    BrightRed = 91,
    BrightGreen = 92,
    BrightYellow = 93,
    BrightBlue = 94,
    BrightMagenta = 95,
    BrightCyan = 96,
    BrightWhite = 97,
    BgBlack = 40,
    BgRed = 41,
    BgGreen = 42,
    BgYellow = 43,
    BgBlue = 44,
    BgMagenta = 45,
    BgCyan = 46,
    BgWhite = 47
}
/** Apply ANSI SGR codes. Pass variadic Color values. */
export declare function style(...codes: number[]): string;
/** Wrap text with given color/style codes, then reset. */
export declare function wrap(text: string, ...codes: number[]): string;
/** Truecolor (24-bit) foreground. */
export declare function rgb(r: number, g: number, b: number): string;
/** Truecolor (24-bit) background. */
export declare function bgRgb(r: number, g: number, b: number): string;
/** Move cursor to row,col (1-indexed). */
export declare function cursorTo(row: number, col: number): string;
/** Move cursor up n lines. */
export declare function cursorUp(n?: number): string;
/** Move cursor down n lines. */
export declare function cursorDown(n?: number): string;
/** Move cursor right n columns. */
export declare function cursorRight(n?: number): string;
/** Move cursor left n columns. */
export declare function cursorLeft(n?: number): string;
/** Clear from cursor to end of line. */
export declare const CLEAR_LINE = "\u001B[K";
/** Clear entire screen. */
export declare const CLEAR_SCREEN = "\u001B[2J";
/** Clear from cursor to end of screen. */
export declare const CLEAR_BELOW = "\u001B[0J";
/** Save cursor position. */
export declare const SAVE_CURSOR = "\u001B7";
/** Restore cursor position. */
export declare const RESTORE_CURSOR = "\u001B8";
/** Hide cursor. */
export declare const HIDE_CURSOR = "\u001B[?25l";
/** Show cursor. */
export declare const SHOW_CURSOR = "\u001B[?25h";
/** Alternate screen buffer enter. */
export declare const ENTER_ALT_SCREEN = "\u001B[?1049h";
/** Alternate screen buffer exit. */
export declare const EXIT_ALT_SCREEN = "\u001B[?1049l";
/** Strip ANSI escape sequences from a string. Useful for width calc. */
export declare function stripAnsi(s: string): string;
/** Visible width of a string (excluding ANSI codes). */
export declare function visibleWidth(s: string): number;
/** Pad a string to exactly `width` visible columns. */
export declare function pad(s: string, width: number, align?: "left" | "right" | "center"): string;
/** Truncate a string to visible width, adding ellipsis if truncated. */
export declare function truncate(s: string, width: number): string;
