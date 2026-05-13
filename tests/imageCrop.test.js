import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateSourceCrop } from '../src/lib/imageCrop.js';

test('calculateSourceCrop matches target aspect and centers by default', () => {
  assert.deepEqual(calculateSourceCrop({
    sourceWidth: 400,
    sourceHeight: 200,
    targetWidth: 100,
    targetHeight: 100
  }), {
    x: 100,
    y: 0,
    width: 200,
    height: 200
  });
});

test('calculateSourceCrop supports zoom and normalized offsets while staying inside source bounds', () => {
  assert.deepEqual(calculateSourceCrop({
    sourceWidth: 400,
    sourceHeight: 200,
    targetWidth: 100,
    targetHeight: 100,
    zoom: 2,
    offsetX: 1,
    offsetY: -1
  }), {
    x: 300,
    y: 0,
    width: 100,
    height: 100
  });
});
