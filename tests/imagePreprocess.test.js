import test from 'node:test';
import assert from 'node:assert/strict';

import {
  colorSpread,
  stylizeImageForBeads
} from '../src/lib/imagePreprocess.js';

function imageDataFromPixels(pixels) {
  return new Uint8ClampedArray(pixels.flatMap(([r, g, b, a = 255]) => [r, g, b, a]));
}

function rgbAt(data, width, x, y) {
  const index = (y * width + x) * 4;
  return [data[index], data[index + 1], data[index + 2]];
}

test('colorSpread measures local photo noise across RGB channels', () => {
  assert.equal(colorSpread([
    [240, 196, 168],
    [250, 204, 176],
    [246, 200, 172]
  ]), 15);
});

test('stylizeImageForBeads smooths skin-tone noise while preserving dark facial detail', () => {
  const width = 5;
  const height = 3;
  const data = imageDataFromPixels([
    [245, 198, 171], [250, 203, 177], [247, 200, 174], [252, 206, 179], [244, 197, 170],
    [249, 202, 176], [246, 199, 173], [12, 10, 9], [251, 204, 178], [248, 201, 175],
    [244, 196, 169], [253, 207, 181], [248, 201, 175], [246, 199, 173], [250, 203, 177]
  ]);

  const beforeSkinSpread = colorSpread([
    rgbAt(data, width, 0, 0),
    rgbAt(data, width, 1, 0),
    rgbAt(data, width, 3, 0),
    rgbAt(data, width, 4, 0)
  ]);

  const stylized = stylizeImageForBeads({
    imageData: data,
    width,
    height,
    smoothingRadius: 1,
    colorThreshold: 42,
    posterizeLevels: 24,
    contrast: 1,
    saturation: 1
  });

  const afterSkinSpread = colorSpread([
    rgbAt(stylized, width, 0, 0),
    rgbAt(stylized, width, 1, 0),
    rgbAt(stylized, width, 3, 0),
    rgbAt(stylized, width, 4, 0)
  ]);
  const eye = rgbAt(stylized, width, 2, 1);

  assert.ok(afterSkinSpread < beforeSkinSpread);
  assert.ok(Math.max(...eye) <= 24);
});

test('stylizeImageForBeads expands thin dark details so pixel sampling keeps facial features', () => {
  const width = 5;
  const height = 5;
  const skin = [238, 188, 158];
  const eye = [18, 16, 14];
  const pixels = Array.from({ length: width * height }, () => skin);
  pixels[2 * width + 2] = eye;

  const stylized = stylizeImageForBeads({
    imageData: imageDataFromPixels(pixels),
    width,
    height,
    smoothingRadius: 1,
    colorThreshold: 44,
    posterizeStep: 12,
    contrast: 1,
    saturation: 1,
    detailSpread: 1,
    detailStrength: 0.5
  });

  const leftOfEye = rgbAt(stylized, width, 1, 2);
  const rightOfEye = rgbAt(stylized, width, 3, 2);

  assert.ok(leftOfEye[0] < 180);
  assert.ok(rightOfEye[0] < 180);
});
