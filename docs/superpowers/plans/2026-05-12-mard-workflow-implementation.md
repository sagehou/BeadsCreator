# MARD Workflow Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved MARD-first image conversion workflow with dominant-color sampling, BFS cleanup, coordinates, randomized starter art, and ironing previews.

**Architecture:** Extract conversion and rendering rules into small testable modules under `src/lib`, keep palette data under `src/data`, and let React components orchestrate UI state. The existing hex-string grid format remains in place for compatibility; helper functions map hex values back to MARD metadata for matching, BOM, and previews.

**Tech Stack:** React 19, Vite 8, built-in `node:test`, Web Worker module, CSS.

---

## File Structure

- Create `src/data/mardColors.js`: MARD-first palette records and brand registry.
- Modify `src/data/colors.js`: re-export MARD data, keep legacy Perler/Hama exports only as compatibility aliases where needed, and replace the fixed smiley starter with random starter pattern helpers.
- Create `src/lib/colorUtils.js`: hex/RGB conversion, perceptual distance, neutral detection, nearest palette matching.
- Create `src/lib/dominantSampling.js`: source-rectangle dominant-color extraction and whole-image-to-grid conversion helpers.
- Create `src/lib/gridCleanup.js`: BFS connected-region detection and speckle cleanup.
- Create `src/lib/previewModes.js`: visual-mode definitions and CSS class helpers.
- Create `src/lib/starterPatterns.js`: emoji-style starter pattern templates.
- Modify `src/workers/kmeansWorker.js`: turn the existing worker into the dominant conversion worker while preserving the message contract enough for `ImageConverter`.
- Modify `src/components/ImageConverter.jsx`: add conversion method label, cleanup threshold control, MARD palette input, and worker payload updates.
- Modify `src/components/ColorPalette.jsx`: make MARD the default palette, add search, and handle larger color sets.
- Modify `src/components/BeadCanvas.jsx`: add coordinate overlays and preview-mode classes.
- Modify `src/components/BomPanel.jsx`: add tabs for material list, preview, and export controls.
- Modify `src/App.jsx`: own `previewMode`, pass MARD palette to conversion/BOM/canvas, use randomized starter grid, and update export rendering.
- Modify `src/index.css`: workflow-sidebar layout polish, coordinates, preview effects, palette search, and responsive safeguards.
- Create `tests/colorUtils.test.js`: palette conversion and matching tests.
- Create `tests/dominantSampling.test.js`: dominant-color tests for black-border behavior.
- Create `tests/gridCleanup.test.js`: BFS cleanup tests.
- Create `tests/starterAndPreview.test.js`: starter grid validity and preview immutability tests.
- Modify `package.json`: add a `test` script using Node's built-in test runner.

## Task 0: Baseline Commit Existing App

**Files:**
- Add: all existing untracked project files except ignored files.

- [ ] **Step 1: Confirm ignored generated files are excluded**

Run: `git status --short`

Expected:

```text
?? .github/
?? README.md
?? eslint.config.js
?? index.html
?? package-lock.json
?? package.json
?? public/
?? src/
?? vite.config.js
```

`.superpowers/`, `node_modules/`, and `dist/` must not appear.

- [ ] **Step 2: Stage baseline files**

Run:

```bash
git add .github README.md eslint.config.js index.html package-lock.json package.json public src vite.config.js
```

Expected: command succeeds.

- [ ] **Step 3: Commit baseline**

Run:

```bash
git commit -m "Add existing BeadsCreator baseline"
```

Expected: commit succeeds and contains the existing application files.

## Task 1: Add Test Harness

**Files:**
- Modify: `package.json`
- Create: `tests/colorUtils.test.js`

- [ ] **Step 1: Write the first failing test**

Create `tests/colorUtils.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { hexToRgbArray, rgbArrayToHex } from '../src/lib/colorUtils.js';

test('hexToRgbArray and rgbArrayToHex round-trip uppercase hex colors', () => {
  assert.deepEqual(hexToRgbArray('#1a2b3c'), [26, 43, 60]);
  assert.equal(rgbArrayToHex([26, 43, 60]), '#1A2B3C');
});
```

- [ ] **Step 2: Add the test script**

Modify `package.json` scripts to include:

```json
"test": "node --test tests/*.test.js"
```

Keep existing scripts unchanged.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`

Expected: FAIL with a module-not-found error for `src/lib/colorUtils.js`.

- [ ] **Step 4: Commit test harness**

Run:

```bash
git add package.json tests/colorUtils.test.js
git commit -m "Add core logic test harness"
```

Expected: commit succeeds with the failing test present.

## Task 2: Implement Color Utilities and MARD Palette Shape

**Files:**
- Create: `src/lib/colorUtils.js`
- Create: `src/data/mardColors.js`
- Modify: `tests/colorUtils.test.js`

- [ ] **Step 1: Extend the failing tests for matching behavior**

Replace `tests/colorUtils.test.js` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hexToRgbArray,
  rgbArrayToHex,
  isNeutralRgb,
  perceptualDistance,
  findNearestPaletteColor,
  normalizePaletteColor
} from '../src/lib/colorUtils.js';

test('hexToRgbArray and rgbArrayToHex round-trip uppercase hex colors', () => {
  assert.deepEqual(hexToRgbArray('#1a2b3c'), [26, 43, 60]);
  assert.equal(rgbArrayToHex([26, 43, 60]), '#1A2B3C');
});

test('normalizePaletteColor creates consistent palette records', () => {
  assert.deepEqual(normalizePaletteColor({
    brand: 'MARD',
    code: 'A01',
    name: 'Black',
    hex: '#202020'
  }), {
    id: 'MARD:A01',
    brand: 'MARD',
    code: 'A01',
    name: 'Black',
    hex: '#202020',
    rgb: [32, 32, 32],
    category: 'solid'
  });
});

test('isNeutralRgb identifies low-chroma colors', () => {
  assert.equal(isNeutralRgb([120, 123, 124]), true);
  assert.equal(isNeutralRgb([120, 70, 20]), false);
});

test('perceptualDistance gives zero for identical colors', () => {
  assert.equal(perceptualDistance([1, 2, 3], [1, 2, 3]), 0);
});

test('findNearestPaletteColor returns the closest enabled color', () => {
  const palette = [
    normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#EF3340' }),
    normalizePaletteColor({ brand: 'MARD', code: 'BLUE', name: 'Blue', hex: '#1F5AA6' })
  ];

  const match = findNearestPaletteColor([235, 55, 65], palette);

  assert.equal(match.code, 'RED');
});

test('findNearestPaletteColor keeps neutral source colors on neutral candidates when available', () => {
  const palette = [
    normalizePaletteColor({ brand: 'MARD', code: 'GRAY', name: 'Gray', hex: '#808080' }),
    normalizePaletteColor({ brand: 'MARD', code: 'GREEN', name: 'Green', hex: '#5FB05F' })
  ];

  const match = findNearestPaletteColor([120, 121, 122], palette);

  assert.equal(match.code, 'GRAY');
});

test('findNearestPaletteColor skips disabled color ids', () => {
  const palette = [
    normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#EF3340' }),
    normalizePaletteColor({ brand: 'MARD', code: 'PINK', name: 'Pink', hex: '#F2A1B2' })
  ];

  const match = findNearestPaletteColor([239, 51, 64], palette, {
    disabledColorIds: new Set(['MARD:RED'])
  });

  assert.equal(match.code, 'PINK');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`

Expected: FAIL because `src/lib/colorUtils.js` does not exist.

- [ ] **Step 3: Implement `src/lib/colorUtils.js`**

Create `src/lib/colorUtils.js`:

```js
const NEUTRAL_CHROMA_THRESHOLD = 28;

export function hexToRgbArray(hex) {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

export function rgbArrayToHex(rgb) {
  return `#${rgb.map((channel) => {
    const value = Math.max(0, Math.min(255, Math.round(channel)));
    return value.toString(16).padStart(2, '0').toUpperCase();
  }).join('')}`;
}

export function normalizePaletteColor(color) {
  const rgb = color.rgb ?? hexToRgbArray(color.hex);
  const hex = color.hex ? rgbArrayToHex(hexToRgbArray(color.hex)) : rgbArrayToHex(rgb);
  const brand = color.brand;
  const code = color.code;

  return {
    id: color.id ?? `${brand}:${code}`,
    brand,
    code,
    name: color.name ?? code,
    hex,
    rgb,
    category: color.category ?? 'solid'
  };
}

export function isNeutralRgb(rgb) {
  return Math.max(...rgb) - Math.min(...rgb) <= NEUTRAL_CHROMA_THRESHOLD;
}

export function perceptualDistance(a, b) {
  const rMean = (a[0] + b[0]) / 2;
  const r = a[0] - b[0];
  const g = a[1] - b[1];
  const blue = a[2] - b[2];
  const redWeight = 2 + rMean / 256;
  const blueWeight = 2 + (255 - rMean) / 256;
  return Math.sqrt(redWeight * r * r + 4 * g * g + blueWeight * blue * blue);
}

export function findNearestPaletteColor(rgb, palette, options = {}) {
  const disabled = options.disabledColorIds ?? new Set();
  const enabledPalette = palette.filter((color) => !disabled.has(color.id));
  const neutralCandidates = isNeutralRgb(rgb)
    ? enabledPalette.filter((color) => isNeutralRgb(color.rgb))
    : [];
  const candidates = neutralCandidates.length > 0 ? neutralCandidates : enabledPalette;

  if (candidates.length === 0) {
    throw new Error('No enabled palette colors are available for matching.');
  }

  let best = candidates[0];
  let bestDistance = perceptualDistance(rgb, best.rgb);

  for (let i = 1; i < candidates.length; i += 1) {
    const distance = perceptualDistance(rgb, candidates[i].rgb);
    if (distance < bestDistance) {
      best = candidates[i];
      bestDistance = distance;
    }
  }

  return { ...best, distance: bestDistance };
}
```

- [ ] **Step 4: Add the initial MARD data file**

Create `src/data/mardColors.js`:

```js
import { normalizePaletteColor } from '../lib/colorUtils.js';

// Source: https://www.pixel-beads.com/zh/mard-bead-color-chart
// Expand this list from the source page during Task 12 when the UI is wired.
const MARD_COLOR_ROWS = [
  { code: 'M-K01', name: 'Black', hex: '#232426' },
  { code: 'M-W01', name: 'White', hex: '#F5F4EE' },
  { code: 'M-R01', name: 'Red', hex: '#F22D41' },
  { code: 'M-Y01', name: 'Yellow', hex: '#FAD52D' },
  { code: 'M-B01', name: 'Blue', hex: '#247AD8' },
  { code: 'M-G01', name: 'Green', hex: '#34A85C' },
  { code: 'M-P01', name: 'Skin Pink', hex: '#F6B2A4' },
  { code: 'M-BR01', name: 'Brown', hex: '#7B4A2D' }
];

export const MARD_COLORS = MARD_COLOR_ROWS.map((color) => normalizePaletteColor({
  ...color,
  brand: 'MARD'
}));

export const PALETTE_BRANDS = {
  MARD: {
    label: 'MARD',
    colors: MARD_COLORS
  }
};

export function getPaletteByBrand(brand = 'MARD') {
  return PALETTE_BRANDS[brand]?.colors ?? MARD_COLORS;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`

Expected: PASS for all tests in `tests/colorUtils.test.js`.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/colorUtils.js src/data/mardColors.js tests/colorUtils.test.js
git commit -m "Add MARD palette color utilities"
```

Expected: commit succeeds.

## Task 3: Add Dominant Color Sampling

**Files:**
- Create: `src/lib/dominantSampling.js`
- Create: `tests/dominantSampling.test.js`

- [ ] **Step 1: Write the failing dominant sampling tests**

Create `tests/dominantSampling.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dominantRgbForCell,
  imageDataToDominantGrid
} from '../src/lib/dominantSampling.js';
import { normalizePaletteColor } from '../src/lib/colorUtils.js';

function imageDataFromPixels(width, height, pixels) {
  return new Uint8ClampedArray(pixels.flatMap(([r, g, b, a = 255]) => [r, g, b, a]));
}

test('dominantRgbForCell chooses the most frequent color bucket instead of averaging', () => {
  const black = [0, 0, 0, 255];
  const white = [255, 255, 255, 255];
  const data = imageDataFromPixels(3, 3, [
    black, black, black,
    black, white, black,
    black, black, white
  ]);

  assert.deepEqual(dominantRgbForCell(data, 3, 3, {
    xStart: 0,
    yStart: 0,
    xEnd: 3,
    yEnd: 3
  }), [0, 0, 0]);
});

test('dominantRgbForCell ignores transparent pixels and composites partial alpha on white', () => {
  const data = imageDataFromPixels(2, 1, [
    [255, 0, 0, 0],
    [0, 0, 0, 128]
  ]);

  assert.deepEqual(dominantRgbForCell(data, 2, 1, {
    xStart: 0,
    yStart: 0,
    xEnd: 2,
    yEnd: 1
  }), [127, 127, 127]);
});

test('imageDataToDominantGrid maps dominant source colors to palette hex values', () => {
  const black = [0, 0, 0, 255];
  const red = [255, 0, 0, 255];
  const data = imageDataFromPixels(2, 1, [black, red]);
  const palette = [
    normalizePaletteColor({ brand: 'MARD', code: 'BLACK', name: 'Black', hex: '#000000' }),
    normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#FF0000' })
  ];

  assert.deepEqual(imageDataToDominantGrid({
    imageData: data,
    sourceWidth: 2,
    sourceHeight: 1,
    targetWidth: 2,
    targetHeight: 1,
    palette
  }), [['#000000', '#FF0000']]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `src/lib/dominantSampling.js` does not exist.

- [ ] **Step 3: Implement dominant sampling**

Create `src/lib/dominantSampling.js`:

```js
import { findNearestPaletteColor } from './colorUtils.js';

const ALPHA_THRESHOLD = 64;
const MATTE_RGB = [255, 255, 255];

function quantizeChannel(value, bucketSize) {
  return Math.round(value / bucketSize) * bucketSize;
}

function pixelRgb(data, index) {
  const alpha = data[index + 3];
  if (alpha < ALPHA_THRESHOLD) return null;
  if (alpha >= 252) return [data[index], data[index + 1], data[index + 2]];

  const opacity = alpha / 255;
  return [
    Math.round(data[index] * opacity + MATTE_RGB[0] * (1 - opacity)),
    Math.round(data[index + 1] * opacity + MATTE_RGB[1] * (1 - opacity)),
    Math.round(data[index + 2] * opacity + MATTE_RGB[2] * (1 - opacity))
  ];
}

export function dominantRgbForCell(data, width, height, rect, options = {}) {
  const bucketSize = options.bucketSize ?? 16;
  const buckets = new Map();

  const xStart = Math.max(0, Math.floor(rect.xStart));
  const yStart = Math.max(0, Math.floor(rect.yStart));
  const xEnd = Math.min(width, Math.ceil(rect.xEnd));
  const yEnd = Math.min(height, Math.ceil(rect.yEnd));

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const index = (y * width + x) * 4;
      const rgb = pixelRgb(data, index);
      if (!rgb) continue;

      const key = [
        quantizeChannel(rgb[0], bucketSize),
        quantizeChannel(rgb[1], bucketSize),
        quantizeChannel(rgb[2], bucketSize)
      ].join(',');

      const bucket = buckets.get(key) ?? { count: 0, rgbTotal: [0, 0, 0] };
      bucket.count += 1;
      bucket.rgbTotal[0] += rgb[0];
      bucket.rgbTotal[1] += rgb[1];
      bucket.rgbTotal[2] += rgb[2];
      buckets.set(key, bucket);
    }
  }

  if (buckets.size === 0) return null;

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }

  return best.rgbTotal.map((value) => Math.round(value / best.count));
}

export function imageDataToDominantGrid({
  imageData,
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  palette,
  disabledColorIds,
  bucketSize
}) {
  const grid = [];

  for (let y = 0; y < targetHeight; y += 1) {
    const row = [];
    for (let x = 0; x < targetWidth; x += 1) {
      const rect = {
        xStart: (x / targetWidth) * sourceWidth,
        yStart: (y / targetHeight) * sourceHeight,
        xEnd: ((x + 1) / targetWidth) * sourceWidth,
        yEnd: ((y + 1) / targetHeight) * sourceHeight
      };
      const rgb = dominantRgbForCell(imageData, sourceWidth, sourceHeight, rect, { bucketSize });
      row.push(rgb ? findNearestPaletteColor(rgb, palette, { disabledColorIds }).hex : null);
    }
    grid.push(row);
  }

  return grid;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: PASS for color utility and dominant sampling tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/dominantSampling.js tests/dominantSampling.test.js
git commit -m "Add dominant color image sampling"
```

Expected: commit succeeds.

## Task 4: Add BFS Grid Cleanup

**Files:**
- Create: `src/lib/gridCleanup.js`
- Create: `tests/gridCleanup.test.js`

- [ ] **Step 1: Write failing BFS cleanup tests**

Create `tests/gridCleanup.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findConnectedRegions,
  cleanupSpeckles
} from '../src/lib/gridCleanup.js';
import { normalizePaletteColor } from '../src/lib/colorUtils.js';

const palette = [
  normalizePaletteColor({ brand: 'MARD', code: 'WHITE', name: 'White', hex: '#FFFFFF' }),
  normalizePaletteColor({ brand: 'MARD', code: 'BLACK', name: 'Black', hex: '#000000' }),
  normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#FF0000' })
];

test('findConnectedRegions groups exact-color neighbors with BFS', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#000000'],
    ['#FFFFFF', '#000000', '#000000']
  ];

  const regions = findConnectedRegions(grid);

  assert.equal(regions.length, 2);
  assert.deepEqual(regions.map((region) => region.cells.length).sort((a, b) => a - b), [3, 3]);
});

test('cleanupSpeckles merges single-cell noise into the best neighboring region', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#000000', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF']
  ];

  assert.deepEqual(cleanupSpeckles(grid, palette, { minRegionSize: 2 }), [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF']
  ]);
});

test('cleanupSpeckles leaves large intentional regions intact', () => {
  const grid = [
    ['#FF0000', '#FF0000', '#FFFFFF'],
    ['#FF0000', '#FF0000', '#FFFFFF']
  ];

  assert.deepEqual(cleanupSpeckles(grid, palette, { minRegionSize: 2 }), grid);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because `src/lib/gridCleanup.js` does not exist.

- [ ] **Step 3: Implement BFS cleanup**

Create `src/lib/gridCleanup.js`:

```js
import { perceptualDistance } from './colorUtils.js';

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function cellKey(x, y) {
  return `${x},${y}`;
}

export function findConnectedRegions(grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = new Set();
  const regions = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const color = grid[y][x];
      const startKey = cellKey(x, y);
      if (!color || visited.has(startKey)) continue;

      const queue = [[x, y]];
      const cells = [];
      visited.add(startKey);

      while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        cells.push({ x: cx, y: cy });

        for (const [dx, dy] of DIRECTIONS) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = cellKey(nx, ny);
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || visited.has(key)) continue;
          if (grid[ny][nx] !== color) continue;
          visited.add(key);
          queue.push([nx, ny]);
        }
      }

      regions.push({ id: regions.length, color, cells });
    }
  }

  return regions;
}

function paletteByHex(palette) {
  return new Map(palette.map((color) => [color.hex.toUpperCase(), color]));
}

function buildRegionLookup(regions) {
  const lookup = new Map();
  for (const region of regions) {
    for (const cell of region.cells) lookup.set(cellKey(cell.x, cell.y), region);
  }
  return lookup;
}

function bestNeighborForRegion(region, regions, lookup, grid, paletteMap) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const sourceColor = paletteMap.get(region.color.toUpperCase());
  const candidates = new Map();

  for (const cell of region.cells) {
    for (const [dx, dy] of DIRECTIONS) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const neighbor = lookup.get(cellKey(nx, ny));
      if (!neighbor || neighbor.id === region.id) continue;
      candidates.set(neighbor.id, neighbor);
    }
  }

  let best = null;
  for (const candidate of candidates.values()) {
    const targetColor = paletteMap.get(candidate.color.toUpperCase());
    const distance = sourceColor && targetColor
      ? perceptualDistance(sourceColor.rgb, targetColor.rgb)
      : Number.POSITIVE_INFINITY;
    const score = { candidate, distance };
    if (
      !best ||
      score.distance < best.distance ||
      (score.distance === best.distance && candidate.cells.length > best.candidate.cells.length)
    ) {
      best = score;
    }
  }

  return best?.candidate ?? null;
}

export function cleanupSpeckles(grid, palette, options = {}) {
  const minRegionSize = Math.max(0, Number(options.minRegionSize ?? 0));
  if (minRegionSize <= 0) return grid;

  const nextGrid = cloneGrid(grid);
  const regions = findConnectedRegions(nextGrid);
  const lookup = buildRegionLookup(regions);
  const paletteMap = paletteByHex(palette);

  for (const region of regions) {
    if (region.cells.length >= minRegionSize) continue;
    const neighbor = bestNeighborForRegion(region, regions, lookup, nextGrid, paletteMap);
    if (!neighbor) continue;
    for (const cell of region.cells) nextGrid[cell.y][cell.x] = neighbor.color;
  }

  return nextGrid;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: PASS for all current tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/gridCleanup.js tests/gridCleanup.test.js
git commit -m "Add BFS speckle cleanup"
```

Expected: commit succeeds.

## Task 5: Add Starter Patterns and Preview Modes

**Files:**
- Create: `src/lib/starterPatterns.js`
- Create: `src/lib/previewModes.js`
- Create: `tests/starterAndPreview.test.js`

- [ ] **Step 1: Write failing starter and preview tests**

Create `tests/starterAndPreview.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STARTER_PATTERN_NAMES,
  generateStarterPattern
} from '../src/lib/starterPatterns.js';
import {
  PREVIEW_MODES,
  previewModeClassName,
  cloneGridForPreview
} from '../src/lib/previewModes.js';

test('generateStarterPattern returns a rectangular editable grid', () => {
  const grid = generateStarterPattern('heart', 29, 29);

  assert.equal(grid.length, 29);
  assert.equal(grid.every((row) => row.length === 29), true);
  assert.equal(grid.flat().some(Boolean), true);
});

test('all named starter patterns can render at default size', () => {
  for (const name of STARTER_PATTERN_NAMES) {
    const grid = generateStarterPattern(name, 29, 29);
    assert.equal(grid.length, 29);
    assert.equal(grid[0].length, 29);
  }
});

test('previewModeClassName maps known preview modes to CSS classes', () => {
  assert.equal(previewModeClassName(PREVIEW_MODES.BEAD), 'preview-bead');
  assert.equal(previewModeClassName(PREVIEW_MODES.TOWEL), 'preview-towel');
});

test('cloneGridForPreview does not mutate source grid', () => {
  const grid = [['#000000']];
  const preview = cloneGridForPreview(grid);
  preview[0][0] = '#FFFFFF';

  assert.equal(grid[0][0], '#000000');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

Expected: FAIL because starter and preview modules do not exist.

- [ ] **Step 3: Implement starter patterns**

Create `src/lib/starterPatterns.js`:

```js
export const STARTER_PATTERN_NAMES = ['heart', 'star', 'flower', 'cat', 'rainbow', 'smile'];

const COLORS = {
  black: '#232426',
  white: '#F5F4EE',
  red: '#F22D41',
  yellow: '#FAD52D',
  blue: '#247AD8',
  green: '#34A85C',
  pink: '#F6B2A4',
  brown: '#7B4A2D'
};

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function setCell(grid, x, y, color) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) grid[y][x] = color;
}

function drawCircle(grid, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) setCell(grid, x, y, color);
    }
  }
}

function drawHeart(grid, cx, cy) {
  drawCircle(grid, cx - 4, cy - 4, 5, COLORS.red);
  drawCircle(grid, cx + 4, cy - 4, 5, COLORS.red);
  for (let y = cy - 3; y <= cy + 9; y += 1) {
    const halfWidth = Math.max(0, 10 - Math.abs(y - cy + 1));
    for (let x = cx - halfWidth; x <= cx + halfWidth; x += 1) setCell(grid, x, y, COLORS.red);
  }
}

function drawStar(grid, cx, cy) {
  for (let i = -10; i <= 10; i += 1) {
    setCell(grid, cx + i, cy, COLORS.yellow);
    setCell(grid, cx, cy + i, COLORS.yellow);
    if (Math.abs(i) <= 7) {
      setCell(grid, cx + i, cy + i, COLORS.yellow);
      setCell(grid, cx + i, cy - i, COLORS.yellow);
    }
  }
}

function drawFlower(grid, cx, cy) {
  drawCircle(grid, cx - 6, cy, 4, COLORS.pink);
  drawCircle(grid, cx + 6, cy, 4, COLORS.pink);
  drawCircle(grid, cx, cy - 6, 4, COLORS.pink);
  drawCircle(grid, cx, cy + 6, 4, COLORS.pink);
  drawCircle(grid, cx, cy, 4, COLORS.yellow);
  for (let y = cy + 5; y <= cy + 12; y += 1) setCell(grid, cx, y, COLORS.green);
}

function drawCat(grid, cx, cy) {
  drawCircle(grid, cx, cy, 10, COLORS.yellow);
  for (let i = 0; i < 7; i += 1) {
    setCell(grid, cx - 9 + i, cy - 9 - i, COLORS.yellow);
    setCell(grid, cx + 9 - i, cy - 9 - i, COLORS.yellow);
  }
  drawCircle(grid, cx - 4, cy - 2, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 2, 1, COLORS.black);
  setCell(grid, cx, cy + 2, COLORS.pink);
  for (let i = -3; i <= 3; i += 1) setCell(grid, cx + i, cy + 6 + Math.abs(i % 2), COLORS.black);
}

function drawRainbow(grid, cx, cy) {
  const bands = [COLORS.red, COLORS.yellow, COLORS.green, COLORS.blue];
  for (let b = 0; b < bands.length; b += 1) {
    const radius = 12 - b * 2;
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const yOffset = Math.round(Math.sqrt(Math.max(0, radius ** 2 - (x - cx) ** 2)));
      setCell(grid, x, cy - yOffset, bands[b]);
      setCell(grid, x, cy - yOffset + 1, bands[b]);
    }
  }
}

function drawSmile(grid, cx, cy) {
  drawCircle(grid, cx, cy, 11, COLORS.yellow);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 3, 1, COLORS.black);
  for (let x = -5; x <= 5; x += 1) {
    const y = cy + 4 + Math.round(0.12 * x * x);
    setCell(grid, cx + x, y, COLORS.red);
  }
}

export function generateStarterPattern(name = randomStarterPatternName(), rows = 29, cols = 29) {
  const grid = emptyGrid(rows, cols);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const patternName = STARTER_PATTERN_NAMES.includes(name) ? name : 'heart';

  if (patternName === 'heart') drawHeart(grid, cx, cy);
  if (patternName === 'star') drawStar(grid, cx, cy);
  if (patternName === 'flower') drawFlower(grid, cx, cy);
  if (patternName === 'cat') drawCat(grid, cx, cy);
  if (patternName === 'rainbow') drawRainbow(grid, cx, cy + 7);
  if (patternName === 'smile') drawSmile(grid, cx, cy);

  return grid;
}

export function randomStarterPatternName() {
  return STARTER_PATTERN_NAMES[Math.floor(Math.random() * STARTER_PATTERN_NAMES.length)];
}
```

- [ ] **Step 4: Implement preview helpers**

Create `src/lib/previewModes.js`:

```js
export const PREVIEW_MODES = {
  BEAD: 'bead',
  IRON: 'iron',
  TOWEL: 'towel',
  FINE_GLITTER: 'fine-glitter',
  COARSE_GLITTER: 'coarse-glitter'
};

export const PREVIEW_MODE_OPTIONS = [
  { id: PREVIEW_MODES.BEAD, label: '拼豆' },
  { id: PREVIEW_MODES.IRON, label: '普通烫' },
  { id: PREVIEW_MODES.TOWEL, label: '毛巾烫' },
  { id: PREVIEW_MODES.FINE_GLITTER, label: '细闪' },
  { id: PREVIEW_MODES.COARSE_GLITTER, label: '粗闪' }
];

export function previewModeClassName(mode) {
  return `preview-${mode || PREVIEW_MODES.BEAD}`;
}

export function cloneGridForPreview(grid) {
  return grid.map((row) => [...row]);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`

Expected: PASS for all current tests.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/starterPatterns.js src/lib/previewModes.js tests/starterAndPreview.test.js
git commit -m "Add starter patterns and preview modes"
```

Expected: commit succeeds.

## Task 6: Wire Palette Data Through Existing Data Module

**Files:**
- Modify: `src/data/colors.js`

- [ ] **Step 1: Update imports and exports**

Modify the top of `src/data/colors.js` to import MARD data:

```js
import { MARD_COLORS, PALETTE_BRANDS, getPaletteByBrand } from './mardColors.js';
import { findNearestPaletteColor, hexToRgbArray } from '../lib/colorUtils.js';
import { generateStarterPattern, randomStarterPatternName } from '../lib/starterPatterns.js';
```

- [ ] **Step 2: Replace `getAllColors` with MARD-first registry behavior**

Replace the current `getAllColors` function:

```js
export function getAllColors(brand = 'MARD') {
  return getPaletteByBrand(brand);
}

export function getPaletteBrands() {
  return PALETTE_BRANDS;
}
```

- [ ] **Step 3: Replace `findClosestColor` implementation**

Replace the current `findClosestColor`:

```js
export function findClosestColor(r, g, b, palette = MARD_COLORS) {
  return findNearestPaletteColor([r, g, b], palette);
}
```

- [ ] **Step 4: Replace `hexToRgb` implementation while keeping existing return shape**

Replace the current `hexToRgb`:

```js
export function hexToRgb(hex) {
  const [r, g, b] = hexToRgbArray(hex);
  return { r, g, b };
}
```

- [ ] **Step 5: Replace the smiley generator export**

Replace `generateSmileyPattern` with compatibility helpers:

```js
export function generateSmileyPattern() {
  return generateStarterPattern(randomStarterPatternName(), 29, 29);
}

export function generateRandomStarterPattern(rows = 29, cols = 29) {
  return generateStarterPattern(randomStarterPatternName(), rows, cols);
}

export { MARD_COLORS, MARD_COLORS as PERLER_COLORS, MARD_COLORS as HAMA_COLORS };
```

Remove the old hard-coded smiley implementation from this file.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: tests pass and Vite build succeeds.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/data/colors.js
git commit -m "Make MARD the default palette"
```

Expected: commit succeeds.

## Task 7: Replace Worker Conversion With Dominant Sampling and Cleanup

**Files:**
- Modify: `src/workers/kmeansWorker.js`

- [ ] **Step 1: Replace worker imports**

At the top of `src/workers/kmeansWorker.js`, add:

```js
import { imageDataToDominantGrid } from '../lib/dominantSampling.js';
import { cleanupSpeckles } from '../lib/gridCleanup.js';
```

Remove K-Means-specific helper functions after the new worker path is in place.

- [ ] **Step 2: Replace `self.onmessage` body**

Use this message handler:

```js
self.onmessage = function (e) {
  const {
    imageData,
    sourceWidth,
    sourceHeight,
    width,
    height,
    paletteColors,
    cleanupThreshold = 0,
    bucketSize = 16
  } = e.data;

  try {
    self.postMessage({ type: 'progress', progress: 10 });

    const grid = imageDataToDominantGrid({
      imageData,
      sourceWidth: sourceWidth ?? width,
      sourceHeight: sourceHeight ?? height,
      targetWidth: width,
      targetHeight: height,
      palette: paletteColors,
      bucketSize
    });

    self.postMessage({ type: 'progress', progress: 75 });

    const cleanedGrid = cleanupThreshold > 0
      ? cleanupSpeckles(grid, paletteColors, { minRegionSize: cleanupThreshold })
      : grid;

    self.postMessage({ type: 'progress', progress: 98 });
    self.postMessage({
      type: 'complete',
      resultGrid: cleanedGrid,
      width,
      height
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build fails if unused K-Means code or import paths are wrong; fix only those errors.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/workers/kmeansWorker.js
git commit -m "Use dominant sampling in image worker"
```

Expected: commit succeeds.

## Task 8: Update Image Converter Controls

**Files:**
- Modify: `src/components/ImageConverter.jsx`

- [ ] **Step 1: Import MARD palette**

Replace current color imports:

```js
import { MARD_COLORS } from '../data/colors';
```

- [ ] **Step 2: Add cleanup threshold state**

Inside `ImageConverter`, add:

```js
const [cleanupThreshold, setCleanupThreshold] = useState(1);
```

Set:

```js
const paletteColors = MARD_COLORS;
```

- [ ] **Step 3: Preserve original image resolution for worker input**

In `img.onload`, create a source canvas at the original image size:

```js
const canvas = document.createElement('canvas');
canvas.width = img.naturalWidth;
canvas.height = img.naturalHeight;
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
```

- [ ] **Step 4: Update worker complete handling**

Replace index-to-hex reconstruction with:

```js
if (msg.type === 'complete') {
  onConvert(msg.resultGrid);
  setProcessing(false);
  setProgress(100);
  worker.terminate();
}
```

- [ ] **Step 5: Update worker payload**

Replace `worker.postMessage` payload with:

```js
worker.postMessage({
  imageData: imageData.data,
  sourceWidth: imageData.width,
  sourceHeight: imageData.height,
  width: gridCols,
  height: gridRows,
  paletteColors,
  maxColors,
  cleanupThreshold,
  bucketSize: 16,
  enhanceEdges
});
```

- [ ] **Step 6: Add cleanup UI**

Inside `.upload-options`, add:

```jsx
<div className="upload-option">
  <label>去杂色</label>
  <input
    type="range"
    min="0"
    max="8"
    value={cleanupThreshold}
    onChange={(e) => setCleanupThreshold(Number(e.target.value))}
    style={{ flex: 1 }}
  />
  <span style={{ fontSize: '0.78rem', minWidth: 22, textAlign: 'right' }}>{cleanupThreshold}</span>
</div>
```

- [ ] **Step 7: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/components/ImageConverter.jsx
git commit -m "Add dominant conversion controls"
```

Expected: commit succeeds.

## Task 9: Update Palette UI for MARD Search

**Files:**
- Modify: `src/components/ColorPalette.jsx`

- [ ] **Step 1: Replace imports**

Replace current imports with:

```js
import { useMemo, useState } from 'react';
import { MARD_COLORS } from '../data/colors';
```

- [ ] **Step 2: Replace brand state with search state**

Inside `ColorPalette`, replace `activeBrand` with:

```js
const [query, setQuery] = useState('');
```

- [ ] **Step 3: Compute filtered colors**

Add:

```js
const colors = useMemo(() => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return MARD_COLORS;
  return MARD_COLORS.filter((color) => (
    color.code.toLowerCase().includes(normalizedQuery) ||
    color.name.toLowerCase().includes(normalizedQuery) ||
    color.hex.toLowerCase().includes(normalizedQuery)
  ));
}, [query]);
```

- [ ] **Step 4: Replace palette tabs with search input**

Replace the `.palette-tabs` block with:

```jsx
<div className="palette-search">
  <input
    type="search"
    placeholder="搜索 MARD 色号"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
</div>
```

- [ ] **Step 5: Keep swatch tooltip metadata**

Use this tooltip text:

```jsx
<div className="color-tooltip">
  {color.brand} {color.code} {color.name}
</div>
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/components/ColorPalette.jsx
git commit -m "Add MARD palette search"
```

Expected: commit succeeds.

## Task 10: Add Canvas Coordinates and Preview Classes

**Files:**
- Modify: `src/components/BeadCanvas.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add `previewMode` prop**

Update `BeadCanvas` signature:

```js
export default function BeadCanvas({
  grid,
  cellSize,
  showGrid,
  activeTool,
  selectedColor,
  onCellAction,
  onZoom,
  symmetry,
  previewMode = 'bead',
}) {
```

- [ ] **Step 2: Add preview class to canvas**

Change the canvas class:

```jsx
className={`bead-canvas ${showGrid ? 'show-grid' : ''} preview-${previewMode}`}
```

- [ ] **Step 3: Render coordinate text in each cell**

Inside each `.bead-cell`, add:

```jsx
<span className="cell-coordinate">{x + 1},{y + 1}</span>
```

Keep the existing event handlers unchanged.

- [ ] **Step 4: Add coordinate CSS**

Add to `src/index.css`:

```css
.cell-coordinate {
  position: absolute;
  inset: 1px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  font-size: clamp(5px, 42%, 8px);
  line-height: 1;
  color: rgba(61, 48, 44, 0.52);
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
  white-space: nowrap;
}

.bead-cell.filled .cell-coordinate {
  color: rgba(255, 255, 255, 0.78);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}
```

- [ ] **Step 5: Add preview CSS**

Add:

```css
.bead-canvas.preview-iron .bead-cell.filled::after {
  top: 8%;
  left: 8%;
  width: 84%;
  height: 84%;
  border-radius: 42%;
  filter: saturate(0.95) contrast(0.98);
  box-shadow: inset 0 1px 3px rgba(255,255,255,0.22);
}

.bead-canvas.preview-towel .bead-cell.filled::after {
  top: 7%;
  left: 7%;
  width: 86%;
  height: 86%;
  border-radius: 38%;
  filter: saturate(0.82) contrast(0.9);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
}

.bead-canvas.preview-fine-glitter .bead-cell.filled::before,
.bead-canvas.preview-coarse-glitter .bead-cell.filled::before {
  content: '';
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  pointer-events: none;
  z-index: 3;
}

.bead-canvas.preview-fine-glitter .bead-cell.filled::before {
  background:
    radial-gradient(circle at 25% 30%, rgba(255,255,255,0.85) 0 8%, transparent 9%),
    radial-gradient(circle at 70% 62%, rgba(255,255,255,0.7) 0 6%, transparent 7%);
}

.bead-canvas.preview-coarse-glitter .bead-cell.filled::before {
  background:
    radial-gradient(circle at 32% 35%, rgba(255,255,255,0.9) 0 14%, transparent 15%),
    radial-gradient(circle at 68% 68%, rgba(255,255,255,0.75) 0 11%, transparent 12%);
}
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/components/BeadCanvas.jsx src/index.css
git commit -m "Add canvas coordinates and preview styles"
```

Expected: commit succeeds.

## Task 11: Add Preview Mode State and Right Panel Controls

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/BomPanel.jsx`

- [ ] **Step 1: Import preview mode options**

In `src/App.jsx`, add:

```js
import { PREVIEW_MODE_OPTIONS, PREVIEW_MODES } from './lib/previewModes';
```

- [ ] **Step 2: Add preview state**

Inside `App`, add:

```js
const [previewMode, setPreviewMode] = useState(PREVIEW_MODES.BEAD);
```

- [ ] **Step 3: Pass preview mode to canvas**

Add props to `BeadCanvas`:

```jsx
previewMode={previewMode}
```

- [ ] **Step 4: Pass preview controls to `BomPanel`**

Add props:

```jsx
previewMode={previewMode}
previewModes={PREVIEW_MODE_OPTIONS}
onPreviewModeChange={setPreviewMode}
```

- [ ] **Step 5: Update `BomPanel` signature**

Add props in `src/components/BomPanel.jsx`:

```js
previewMode,
previewModes,
onPreviewModeChange,
```

- [ ] **Step 6: Add preview mode buttons in `BomPanel`**

Near export scale controls, add:

```jsx
<div className="bom-preview-modes">
  {previewModes.map((mode) => (
    <button
      key={mode.id}
      type="button"
      className={`scale-btn ${previewMode === mode.id ? 'active' : ''}`}
      onClick={() => onPreviewModeChange(mode.id)}
    >
      {mode.label}
    </button>
  ))}
</div>
```

- [ ] **Step 7: Add CSS for preview mode button wrap**

In `src/index.css`, add:

```css
.bom-preview-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0;
}
```

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/App.jsx src/components/BomPanel.jsx src/index.css
git commit -m "Add ironing preview controls"
```

Expected: commit succeeds.

## Task 12: Expand MARD Color Data From Source

**Files:**
- Modify: `src/data/mardColors.js`

- [ ] **Step 1: Extract source data**

Open the source page:

```text
https://www.pixel-beads.com/zh/mard-bead-color-chart
```

Inspect the page data and collect MARD records with at least:

```js
{ code: '...', name: '...', hex: '#......' }
```

Expected: collected records are only MARD colors with valid six-digit hex values.

- [ ] **Step 2: Replace `MARD_COLOR_ROWS`**

In `src/data/mardColors.js`, replace the seed list with the extracted full list:

```js
const MARD_COLOR_ROWS = [
  { code: '...', name: '...', hex: '#......' }
];
```

Every row must have a unique `code`.

- [ ] **Step 3: Add a color count test**

Append to `tests/colorUtils.test.js`:

```js
import { MARD_COLORS } from '../src/data/mardColors.js';

test('MARD color data has unique codes and valid hex values', () => {
  const codes = new Set(MARD_COLORS.map((color) => color.code));

  assert.equal(codes.size, MARD_COLORS.length);
  assert.ok(MARD_COLORS.length >= 100);
  assert.equal(MARD_COLORS.every((color) => /^#[0-9A-F]{6}$/.test(color.hex)), true);
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS. If the page provides fewer than 100 usable MARD records, update the assertion to the actual verified count and document the source limitation in `src/data/mardColors.js`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/data/mardColors.js tests/colorUtils.test.js
git commit -m "Expand MARD color data"
```

Expected: commit succeeds.

## Task 13: Update PNG Export for Preview Mode

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Use preview mode in export renderer**

Inside `handleExportPng`, replace bead drawing with mode-aware drawing:

```js
const isIroned = previewMode !== PREVIEW_MODES.BEAD;
const radius = isIroned ? s * 0.46 : s * 0.4;
ctx.beginPath();
ctx.arc(x * s + s / 2, y * s + s / 2, radius, 0, Math.PI * 2);
ctx.fill();

if (previewMode === PREVIEW_MODES.FINE_GLITTER || previewMode === PREVIEW_MODES.COARSE_GLITTER) {
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  const sparkleRadius = previewMode === PREVIEW_MODES.COARSE_GLITTER ? s * 0.08 : s * 0.045;
  ctx.beginPath();
  ctx.arc(x * s + s * 0.36, y * s + s * 0.34, sparkleRadius, 0, Math.PI * 2);
  ctx.fill();
}
```

- [ ] **Step 2: Add dependencies to `handleExportPng`**

Ensure `handleExportPng` dependency list includes:

```js
[grid, exportScale, previewMode]
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/App.jsx
git commit -m "Export active preview rendering"
```

Expected: commit succeeds.

## Task 14: Final Verification and Browser Smoke Test

**Files:**
- No code changes expected unless verification reveals a defect.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected:

```text
npm test: all tests pass
npm run lint: no lint errors
npm run build: build succeeds
```

- [ ] **Step 2: Start the dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser smoke test**

Open the Vite URL and verify:

- App loads without a Vite/React error overlay.
- The starter pattern is not always the old smiley.
- The left palette shows MARD and a search input.
- Image conversion shows cleanup threshold control.
- Canvas cells show coordinate text.
- Right panel preview buttons switch visible canvas styling.

- [ ] **Step 4: Commit any verification fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "Fix MARD workflow verification issues"
```

If no fixes were needed, do not create an empty commit.

- [ ] **Step 5: Summarize verification evidence**

Record the exact command results and browser URL in the final implementation response.

## Self-Review

Spec coverage:

- MARD-first palette: Tasks 2, 6, 9, 12.
- Dominant-color sampling: Tasks 3, 7, 8.
- BFS cleanup: Tasks 4, 7, 8.
- Random starter patterns: Tasks 5, 6.
- Coordinates: Task 10.
- Ironing preview modes: Tasks 5, 10, 11, 13.
- Workflow sidebar direction: Tasks 8, 9, 11, CSS in Tasks 10-11.
- Tests and verification: Tasks 1-5, 12, 14.
- Baseline Git handling: Task 0.

Placeholder scan:

- No `TBD` or `TODO` placeholders are present.
- Task 12 depends on extracting the live MARD source data because that source is external; the task defines exact required record shape, validation, and fallback assertion behavior.

Type consistency:

- Palette records use `{ id, brand, code, name, hex, rgb, category }`.
- Grid cells remain `hex | null`.
- Preview mode ids are shared from `PREVIEW_MODES`.
