import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IMAGE_IMPORT_PRESETS,
  imageImportPresetOptions
} from '../src/lib/imageImportPresets.js';

test('imageImportPresetOptions exposes tuned presets for common source types', () => {
  assert.deepEqual(Object.keys(IMAGE_IMPORT_PRESETS), ['portrait', 'photo', 'icon', 'lineArt', 'pixel']);
  assert.equal(imageImportPresetOptions('portrait').cleanupThreshold, 1);
  assert.equal(imageImportPresetOptions('lineArt').preprocessOptions.detailStrength > imageImportPresetOptions('photo').preprocessOptions.detailStrength, true);
  assert.equal(imageImportPresetOptions('pixel').preprocessMode, 'none');
});

test('imageImportPresetOptions falls back to portrait for unknown preset ids', () => {
  assert.deepEqual(imageImportPresetOptions('missing'), imageImportPresetOptions('portrait'));
});
