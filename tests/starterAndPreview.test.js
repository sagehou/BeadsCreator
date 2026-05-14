import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STARTER_EMOJIS,
  STARTER_PATTERN_NAMES,
  generateStarterPattern
} from '../src/lib/starterPatterns.js';
import { MARD_COLORS } from '../src/data/colors.js';
import {
  PREVIEW_MODE_OPTIONS,
  PREVIEW_MODES,
  canvasPreviewClassName,
  previewModeClassName,
  cloneGridForPreview,
  exportPreviewStyleForMode
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

test('starter patterns are curated expression faces', () => {
  assert.deepEqual(
    STARTER_EMOJIS,
    ['😉', '😎', '😘', '🤣', '👍', '😋', '😜', '🤓', '🐻', '🐧']
  );
  assert.equal(STARTER_PATTERN_NAMES.length, STARTER_EMOJIS.length);
});

test('starter pattern colors are all present in the MARD palette', () => {
  const paletteHexes = new Set(MARD_COLORS.map((color) => color.hex));

  for (const name of STARTER_PATTERN_NAMES) {
    const usedColors = new Set(generateStarterPattern(name, 29, 29).flat().filter(Boolean));

    for (const color of usedColors) {
      assert.equal(paletteHexes.has(color), true, `${name} uses non-MARD color ${color}`);
    }
  }
});

test('previewModeClassName maps known preview modes to CSS classes', () => {
  assert.equal(previewModeClassName(PREVIEW_MODES.BEAD), 'preview-bead');
  assert.equal(previewModeClassName(PREVIEW_MODES.TOWEL), 'preview-towel');
});

test('PREVIEW_MODE_OPTIONS labels are valid UI strings', () => {
  assert.deepEqual(
    PREVIEW_MODE_OPTIONS.map((option) => option.label),
    ['拼豆', '普通烫', '毛巾烫', '细闪', '粗闪']
  );
});

test('previewModeClassName falls back for invalid values', () => {
  assert.equal(previewModeClassName('bad class'), 'preview-bead');
});

test('canvasPreviewClassName combines grid and validated preview classes', () => {
  assert.equal(
    canvasPreviewClassName(true, PREVIEW_MODES.FINE_GLITTER),
    'bead-canvas show-grid preview-fine-glitter'
  );
  assert.equal(
    canvasPreviewClassName(false, 'bad class'),
    'bead-canvas preview-bead'
  );
});

test('canvasPreviewClassName keeps towel mode distinguishable on the canvas', () => {
  assert.equal(
    canvasPreviewClassName(true, PREVIEW_MODES.TOWEL),
    'bead-canvas show-grid preview-towel'
  );
});

test('cloneGridForPreview does not mutate source grid', () => {
  const grid = [['#000000']];
  const preview = cloneGridForPreview(grid);
  preview[0][0] = '#FFFFFF';

  assert.equal(grid[0][0], '#000000');
});

test('exportPreviewStyleForMode keeps glitter round and distinguishes ironed styles', () => {
  assert.deepEqual(exportPreviewStyleForMode(PREVIEW_MODES.FINE_GLITTER), {
    shape: 'circle',
    radiusRatio: 0.4,
    sparkleRadiusRatio: 0.045
  });
  assert.deepEqual(exportPreviewStyleForMode(PREVIEW_MODES.COARSE_GLITTER), {
    shape: 'circle',
    radiusRatio: 0.4,
    sparkleRadiusRatio: 0.08
  });

  assert.deepEqual(exportPreviewStyleForMode(PREVIEW_MODES.IRON), {
    shape: 'roundedRect',
    insetRatio: 0.08,
    cornerRadiusRatio: 0.42
  });
  assert.deepEqual(exportPreviewStyleForMode(PREVIEW_MODES.TOWEL), {
    shape: 'roundedRect',
    insetRatio: 0.07,
    cornerRadiusRatio: 0.38
  });
  assert.notDeepEqual(
    exportPreviewStyleForMode(PREVIEW_MODES.IRON),
    exportPreviewStyleForMode(PREVIEW_MODES.TOWEL)
  );
});
