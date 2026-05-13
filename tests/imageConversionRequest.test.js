import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createImageConversionRequest,
  hasTargetSizeChanged
} from '../src/lib/imageConversionRequest.js';

test('hasTargetSizeChanged detects resized board targets for cached images', () => {
  assert.equal(hasTargetSizeChanged({ rows: 29, cols: 29 }, { rows: 40, cols: 29 }), true);
  assert.equal(hasTargetSizeChanged({ rows: 29, cols: 29 }, { rows: 29, cols: 29 }), false);
  assert.equal(hasTargetSizeChanged(null, { rows: 29, cols: 29 }), true);
});

test('createImageConversionRequest reuses original image data for new board sizes', () => {
  const imageData = new Uint8ClampedArray([255, 0, 0, 255]);
  const paletteColors = [{ hex: '#FF0000', rgb: [255, 0, 0] }];

  assert.deepEqual(createImageConversionRequest({
    source: {
      imageData,
      width: 1,
      height: 1
    },
    target: {
      rows: 18,
      cols: 24
    },
    paletteColors,
    maxColors: 16,
    cleanupThreshold: 3,
    bucketSize: 12,
    enhanceEdges: false,
    preprocessMode: 'none'
  }), {
    imageData,
    sourceWidth: 1,
    sourceHeight: 1,
    width: 24,
    height: 18,
    paletteColors,
    maxColors: 16,
    cleanupThreshold: 3,
    bucketSize: 12,
    enhanceEdges: false,
    preprocessMode: 'none'
  });
});
