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

test('imageDataToDominantGrid samples from an optional source crop rectangle', () => {
  const black = [0, 0, 0, 255];
  const red = [255, 0, 0, 255];
  const data = imageDataFromPixels(4, 1, [black, black, red, red]);
  const palette = [
    normalizePaletteColor({ brand: 'MARD', code: 'BLACK', name: 'Black', hex: '#000000' }),
    normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#FF0000' })
  ];

  assert.deepEqual(imageDataToDominantGrid({
    imageData: data,
    sourceWidth: 4,
    sourceHeight: 1,
    targetWidth: 1,
    targetHeight: 1,
    sourceCrop: { x: 2, y: 0, width: 2, height: 1 },
    palette
  }), [['#FF0000']]);
});
