# Termalytics 📊✨

> Zero-dependency, modern TypeScript library and CLI for building gorgeous terminal dashboards and visualizations.

`termalytics` brings high-performance data visualization to your Node.js scripts, CLIs, and servers. Built from scratch with zero runtime dependencies, TypeScript-first types, support for 24-bit Truecolor ANSI, and a powerful sub-pixel Braille canvas.

---

## Features

- **Zero Runtime Dependencies** — Tiny footprint, no install bloating.
- **Braille Canvas** — Renders sub-pixel lines and curves by utilizing the Unicode Braille Patterns block (2×4 pixel density per text cell).
- **Horizontal Bar Charts** — Smooth fractional block rendering (`████▍`).
- **Modern Color Engine** — Support for 24-bit RGB Truecolor and classic 16-color ANSI maps.
- **Sparklines & Gauges** — Ultra-compact visualizations for inline logs and status lines.
- **Box-Drawing Tables & Heatmaps** — Structured data tables with alignment controls and truecolor activity matrices.
- **Grid Layout Engine** — Flexibly compose widgets into responsive multi-panel dashboards.
- **CLI Mode** — Pipe CSV, JSON, or newlines directly to generate instant charts on standard input.
- **Live Mode** — Build real-time updating terminal interfaces with cursor control and alternate-screen buffering.

---

## Installation

Until the npm registry package is published, install the verified GitHub release tarball:

```bash
npm install https://github.com/wenn-id/termalytics/releases/download/v1.0.2/termalytics-1.0.2.tgz
```

For global CLI usage:

```bash
npm install -g https://github.com/wenn-id/termalytics/releases/download/v1.0.2/termalytics-1.0.2.tgz
```

Then verify:

```bash
termalytics --help
```

---

## Quick Start

### 1. In Your TypeScript/JavaScript Code

```typescript
import { lineChart, barChart, gauge, table, Color, wrap } from 'termalytics';

// Line Chart (Multi-series using Braille pixels)
const seriesA = [10, 30, 45, 25, 60, 90, 80];
const seriesB = [50, 48, 55, 60, 30, 20, 45];

console.log(lineChart([seriesA, seriesB], {
  title: "Server Performance",
  width: 60,
  height: 10,
  series: [
    { label: "CPU", color: Color.Cyan },
    { label: "Memory", color: Color.Magenta }
  ]
}));

// Horizontal Bar Chart
console.log(barChart([
  { label: "Node.js", value: 92 },
  { label: "Rust", value: 85 },
  { label: "Go", value: 74 }
], { width: 50, title: "Language Adoption" }));

// Status Gauge
console.log(gauge(75.5, 100, { label: "Disk Usage", width: 30 }));
```

---

### 2. Using the CLI

Termalytics automatically detects CSV, TSV, JSON, and list formats.

#### Line Chart
```bash
# Feed a JSON array of values
echo '[10, 24, 45, 30, 75, 90, 60]' | termalytics line --title="Hourly Requests"

# Multi-series JSON
echo '{"series": [[5, 15, 30], [25, 20, 10]]}' | termalytics line
```

#### Bar Chart
```bash
# Line-separated raw values
seq 1 10 | termalytics bar
```

#### Bordered Table
```bash
# Pipe non-numeric CSV
echo -e "Service,Status,Latency\napi-gw,healthy,12ms\nauth-svc,healthy,8ms\ndb-primary,degraded,45ms" | termalytics table
```

#### Sparkline (Inline compact logs)
```bash
echo '[20, 45, 90, 50, 30, 80]' | termalytics spark
```

---

## Visual Showcase

### Multi-Series Line Chart (Braille resolution)
```
 Server Performance
  ● CPU  ● Memory
    90┤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠀⠀⠀
      ┤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠔⠊⠉⠑⠤⡀⠀⠀⠀⠀⠀⠀⡠⠔⠊⠁⠈⠢⡀⠀⠀⠀⠀
    60┤⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡠⠊⠀⠀⠀⠀⠀⠀⠈⠢⡀⠀⠀⢀⠔⠁⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀
      ┤⠀⠀⠀⠀⠀⠀⠀⡠⠔⠉⠀⠈⠑⠤⡀⠀⠀⠀⠀⠀⢀⠜⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠢⣀⠔⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠑⢄
    30┤⢀⣀⠀⠀⠀⠀⡰⠁⠀⠀⠀⠀⠀⠀⠈⠑⠤⣀⠀⡠⠊⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
      ┤⠀⠈⠑⠢⢄⡰⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
     0┤⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
      └──────────────────────────────────────────────────────────────
```

### Smooth Bar Chart (with fractional steps)
```
      Rust █████████████████████████████████████▍ 89
        Go ██████████████████████████████▊ 71
TypeScript ████████████████████████████████████████ 95
```

---

## API Reference

### Charts

#### `lineChart(dataSeries: number[][], opts?: ChartOptions): string`
Plots multiple dataset lines using Unicode Braille pixels.
- `width`: Number of text columns (default `80`).
- `height`: Number of text rows (default `15`).
- `min`/`max`: Force scale bounds (defaults to data range).
- `showAxis`: Draw y-axis labels and boundary grid (default `true`).
- `series`: Config arrays like `{ label: string, color: number }`.

#### `barChart(data: Array<{ label: string, value: number } | number>, opts?: ChartOptions): string`
Creates horizontal bars.
- Automatically normalizes lengths.
- Colors negative values red.

#### `sparkline(data: number[], opts?: { width?: number, color?: number }): string`
Renders an inline line chart using 8 distinct vertical block levels (` ▂▃▄▅▆▇█`).

#### `gauge(value: number, maxValue: number, opts?: { width?: number, label?: string, color?: number }): string`
A progress bar indicator. Scales color automatically from Green (low) to Yellow (medium) to Red (critical).

---

### Layout & Screen

#### `panel(content: string[], opts?: PanelOptions): string`
Draws a border around pre-rendered text lines with configurable title alignment, colors, and inner padding.

#### `grid(cells: string[], opts: GridOptions): string`
Arranges multiple panels side-by-side or stacked in rows. Automatically scales panel heights to align cleanly.

#### `liveScreen(opts: ScreenOptions): { stop: () => void }`
Switches the terminal to the alternate screen buffer, hides the cursor, and redraws your screen template at the configured refresh rate. Automatically handles `SIGINT`/`SIGTERM` interrupts to restore your user's shell cleanly.

---

## License

MIT License. Designed & developed with 💙 by Alwan Juliawan.
