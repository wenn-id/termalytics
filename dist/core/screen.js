/**
 * Screen: terminal screen manager for live/interactive dashboards.
 * Uses alternate screen buffer, cursor hiding, and periodic redraw.
 * @module core/screen
 */
import process from "node:process";
import { ENTER_ALT_SCREEN, EXIT_ALT_SCREEN, HIDE_CURSOR, SHOW_CURSOR, CLEAR_SCREEN, cursorTo, } from "./ansi.js";
/**
 * Run a live dashboard. Calls `render()` every `interval` ms.
 * Enters alt screen, hides cursor, and cleans up on SIGINT / SIGTERM.
 * Returns a `stop()` function.
 */
export function liveScreen(opts) {
    const altScreen = opts.altScreen ?? true;
    const interval = opts.interval ?? 1000;
    const out = process.stdout;
    if (altScreen)
        out.write(ENTER_ALT_SCREEN);
    out.write(HIDE_CURSOR);
    const draw = () => {
        const content = opts.render();
        out.write(cursorTo(1, 1) + CLEAR_SCREEN + cursorTo(1, 1) + content);
    };
    draw();
    const timer = setInterval(draw, interval);
    const cleanup = () => {
        clearInterval(timer);
        out.write(SHOW_CURSOR);
        if (altScreen)
            out.write(EXIT_ALT_SCREEN);
    };
    const onSignal = () => {
        cleanup();
        process.exit(0);
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
    return {
        stop: () => {
            process.removeListener("SIGINT", onSignal);
            process.removeListener("SIGTERM", onSignal);
            cleanup();
        },
    };
}
/**
 * Get terminal size. Falls back to 80×24 if unavailable.
 */
export function termSize() {
    return {
        cols: process.stdout.columns ?? 80,
        rows: process.stdout.rows ?? 24,
    };
}
