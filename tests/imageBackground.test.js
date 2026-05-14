import test from 'node:test';
import assert from 'node:assert/strict';

import {
  removeBackgroundFromImageData,
  suggestBoardSizeForComplexity
} from '../src/lib/imageBackground.js';

function imageDataFromPixels(pixels) {
  return new Uint8ClampedArray(pixels.flatMap(([r, g, b, a = 255]) => [r, g, b, a]));
}

function alphaAt(data, width, x, y) {
  return data[(y * width + x) * 4 + 3];
}

test('removeBackgroundFromImageData removes only edge-connected background color', () => {
  const width = 5;
  const height = 5;
  const white = [250, 250, 248];
  const red = [210, 30, 40];
  const pixels = [
    white, white, white, white, white,
    white, red, red, red, white,
    white, red, white, red, white,
    white, red, red, red, white,
    white, white, white, white, white
  ];

  const result = removeBackgroundFromImageData({
    imageData: imageDataFromPixels(pixels),
    width,
    height
  });

  assert.ok(result);
  assert.equal(alphaAt(result, width, 0, 0), 0);
  assert.equal(alphaAt(result, width, 4, 4), 0);
  assert.equal(alphaAt(result, width, 1, 1), 255);
  assert.equal(alphaAt(result, width, 2, 2), 255);
});

test('removeBackgroundFromImageData skips full-bleed images without edge consensus', () => {
  const width = 3;
  const height = 3;
  const data = imageDataFromPixels([
    [255, 0, 0], [0, 255, 0], [0, 0, 255],
    [255, 255, 0], [20, 20, 20], [0, 255, 255],
    [255, 0, 255], [80, 80, 80], [255, 128, 0]
  ]);

  assert.equal(removeBackgroundFromImageData({ imageData: data, width, height }), null);
});

test('suggestBoardSizeForComplexity recommends larger boards only when detail needs it', () => {
  assert.equal(suggestBoardSizeForComplexity(24, 29), null);
  assert.equal(suggestBoardSizeForComplexity(55, 29), 50);
  assert.equal(suggestBoardSizeForComplexity(82, 50), 58);
  assert.equal(suggestBoardSizeForComplexity(90, 58), null);
});

test('suggestBoardSizeForComplexity respects an explicit maximum board size', () => {
  assert.equal(suggestBoardSizeForComplexity(82, 50, { maxBoardSize: 50 }), null);
});
