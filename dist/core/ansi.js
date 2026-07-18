/**
 * ANSI escape codes and styling helpers.
 * Zero-dependency. No external color library.
 * @module core/ansi
 */
const RESET = "\x1b[0m";
/** Apply ANSI SGR codes. Pass variadic Color values. */
export function style(...codes) {
    if (codes.length === 0)
        return RESET;
    return `\x1b[${codes.join(";")}m`;
}
/** Wrap text with given color/style codes, then reset. */
export function wrap(text, ...codes) {
    if (codes.length === 0)
        return text;
    return `${style(...codes)}${text}${RESET}`;
}
/** Truecolor (24-bit) foreground. */
export function rgb(r, g, b) {
    return `\x1b[38;2;${r};${g};${b}m`;
}
/** Truecolor (24-bit) background. */
export function bgRgb(r, g, b) {
    return `\x1b[48;2;${r};${g};${b}m`;
}
/** Move cursor to row,col (1-indexed). */
export function cursorTo(row, col) {
    return `\x1b[${row};${col}H`;
}
/** Move cursor up n lines. */
export function cursorUp(n = 1) {
    return `\x1b[${n}A`;
}
/** Move cursor down n lines. */
export function cursorDown(n = 1) {
    return `\x1b[${n}B`;
}
/** Move cursor right n columns. */
export function cursorRight(n = 1) {
    return `\x1b[${n}C`;
}
/** Move cursor left n columns. */
export function cursorLeft(n = 1) {
    return `\x1b[${n}D`;
}
/** Clear from cursor to end of line. */
export const CLEAR_LINE = "\x1b[K";
/** Clear entire screen. */
export const CLEAR_SCREEN = "\x1b[2J";
/** Clear from cursor to end of screen. */
export const CLEAR_BELOW = "\x1b[0J";
/** Save cursor position. */
export const SAVE_CURSOR = "\x1b7";
/** Restore cursor position. */
export const RESTORE_CURSOR = "\x1b8";
/** Hide cursor. */
export const HIDE_CURSOR = "\x1b[?25l";
/** Show cursor. */
export const SHOW_CURSOR = "\x1b[?25h";
/** Alternate screen buffer enter. */
export const ENTER_ALT_SCREEN = "\x1b[?1049h";
/** Alternate screen buffer exit. */
export const EXIT_ALT_SCREEN = "\x1b[?1049l";
/** Strip ANSI escape sequences from a string. Useful for width calc. */
export function stripAnsi(s) {
    // biome-ignore lint: regex for ANSI escapes is intentionally complex
    return s.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}
/** Visible width of a string (excluding ANSI codes). */
export function visibleWidth(s) {
    return stripAnsi(s).length;
}
/** Pad a string to exactly `width` visible columns. */
export function pad(s, width, align = "left") {
    const visible = stripAnsi(s);
    const w = visible.length;
    if (w === width)
        return s;
    if (w > width)
        return visible.slice(0, width);
    const pad = width - w;
    if (align === "right")
        return " ".repeat(pad) + s;
    if (align === "center") {
        const left = Math.floor(pad / 2);
        return " ".repeat(left) + s + " ".repeat(pad - left);
    }
    return s + " ".repeat(pad);
}
/** Truncate a string to visible width, adding ellipsis if truncated. */
export function truncate(s, width) {
    const visible = stripAnsi(s);
    if (visible.length <= width)
        return s;
    if (width <= 1)
        return visible.slice(0, width);
    return visible.slice(0, width - 1) + "…";
}
