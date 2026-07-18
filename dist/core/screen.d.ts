/**
 * Screen: terminal screen manager for live/interactive dashboards.
 * Uses alternate screen buffer, cursor hiding, and periodic redraw.
 * @module core/screen
 */
export interface ScreenOptions {
    /** Use alternate screen buffer (restore original terminal on exit). Default: true */
    altScreen?: boolean;
    /** Refresh interval in ms. Default: 1000 */
    interval?: number;
    /** Render function: called each tick, returns the full screen content string. */
    render: () => string;
}
/**
 * Run a live dashboard. Calls `render()` every `interval` ms.
 * Enters alt screen, hides cursor, and cleans up on SIGINT / SIGTERM.
 * Returns a `stop()` function.
 */
export declare function liveScreen(opts: ScreenOptions): {
    stop: () => void;
};
/**
 * Get terminal size. Falls back to 80×24 if unavailable.
 */
export declare function termSize(): {
    cols: number;
    rows: number;
};
