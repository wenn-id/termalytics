/**
 * Scale functions: map data values to pixel coordinates.
 * Supports linear and logarithmic scales.
 * @module core/scale
 */
export type ScaleType = "linear" | "log";
export interface ScaleOptions {
    type?: ScaleType;
    domain?: [number, number];
    range?: [number, number];
    /** Clamp values outside domain. Default: true. */
    clamp?: boolean;
}
/**
 * A scale maps a value from domain [d0, d1] to range [r0, r1].
 */
export declare class Scale {
    readonly type: ScaleType;
    readonly domain: [number, number];
    readonly range: [number, number];
    readonly clamp: boolean;
    constructor(opts?: ScaleOptions);
    /** Map a single value through the scale. */
    map(value: number): number;
    /** Inverse map: from range coordinate back to domain value. */
    invert(pixel: number): number;
    /** Generate nice tick values for the domain. */
    ticks(count?: number): number[];
}
/**
 * Generate "nice" tick values for a linear domain.
 * Based on D3's nice algorithm.
 */
export declare function niceTicks(min: number, max: number, count?: number): number[];
/**
 * Generate ticks for a logarithmic domain.
 */
export declare function logTicks(min: number, max: number, count?: number): number[];
/**
 * Format a number for axis labels.
 */
export declare function formatTick(value: number): string;
