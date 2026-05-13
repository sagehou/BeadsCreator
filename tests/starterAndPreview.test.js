import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STARTER_PATTERN_NAMES,
  generateStarterPattern
} from '../src/lib/starterPatterns.js';
import {
  PREVIEW_MODE_OPTIONS,
  PREVIEW_MODES,
  canvasPreviewClassName,
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

test('cloneGridForPreview does not mutate source grid', () => {
  const grid = [['#000000']];
  const preview = cloneGridForPreview(grid);
  preview[0][0] = '#FFFFFF';

  assert.equal(grid[0][0], '#000000');
});
