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
export class Scale {
  readonly type: ScaleType;
  readonly domain: [number, number];
  readonly range: [number, number];
  readonly clamp: boolean;

  constructor(opts: ScaleOptions = {}) {
    this.type = opts.type ?? "linear";
    this.domain = opts.domain ?? [0, 1];
    this.range = opts.range ?? [0, 1];
    this.clamp = opts.clamp ?? true;
  }

  /** Map a single value through the scale. */
  map(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;

    let v = value;
    if (this.clamp) {
      v = Math.max(Math.min(v, Math.max(d0, d1)), Math.min(d0, d1));
    }

    if (this.type === "log") {
      const ld0 = Math.log10(d0 <= 0 ? 1e-10 : d0);
      const ld1 = Math.log10(d1 <= 0 ? 1e-10 : d1);
      const lv = Math.log10(v <= 0 ? 1e-10 : v);
      const t = (lv - ld0) / (ld1 - ld0 || 1);
      return r0 + t * (r1 - r0);
    }

    const t = (v - d0) / (d1 - d0 || 1);
    return r0 + t * (r1 - r0);
  }

  /** Inverse map: from range coordinate back to domain value. */
  invert(pixel: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    const t = (pixel - r0) / (r1 - r0 || 1);

    if (this.type === "log") {
      const ld0 = Math.log10(d0 <= 0 ? 1e-10 : d0);
      const ld1 = Math.log10(d1 <= 0 ? 1e-10 : d1);
      return Math.pow(10, ld0 + t * (ld1 - ld0));
    }

    return d0 + t * (d1 - d0);
  }

  /** Generate nice tick values for the domain. */
  ticks(count = 5): number[] {
    const [d0, d1] = this.domain;
    const lo = Math.min(d0, d1);
    const hi = Math.max(d0, d1);

    if (this.type === "log") {
      return logTicks(lo, hi, count);
    }
    return niceTicks(lo, hi, count);
  }
}

/**
 * Generate "nice" tick values for a linear domain.
 * Based on D3's nice algorithm.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    if (min === 0) return [0, 1];
    return [-Math.abs(min), 0, Math.abs(min)];
  }

  const range = max - min;
  const rawStep = range / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let step: number;
  if (normalized < 1.5) step = 1;
  else if (normalized < 3) step = 2;
  else if (normalized < 7) step = 5;
  else step = 10;
  step *= magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

/**
 * Generate ticks for a logarithmic domain.
 */
export function logTicks(min: number, max: number, count = 5): number[] {
  if (min <= 0 || max <= 0) return [1, 10, 100];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  const ticks: number[] = [];
  for (let p = lo; p <= hi; p++) {
    ticks.push(Math.pow(10, p));
  }
  // If too many, thin out
  if (ticks.length > count * 2) {
    return ticks.filter((_, i) => i % 2 === 0);
  }
  return ticks;
}

/**
 * Format a number for axis labels.
 */
export function formatTick(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  if (abs >= 1) return value.toFixed(abs < 10 ? 1 : 0);
  if (abs >= 0.01) return value.toFixed(2);
  return value.toExponential(1);
}
