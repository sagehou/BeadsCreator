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

test('rgbArrayToHex rejects invalid RGB arrays', () => {
  assert.throws(() => rgbArrayToHex([1, 2, NaN]), /Invalid RGB color/);
  assert.throws(() => rgbArrayToHex([300, 0, 0]), /Invalid RGB color/);
  assert.throws(() => rgbArrayToHex([1.4, 2, 3]), /Invalid RGB color/);
  assert.throws(() => rgbArrayToHex([1, 2]), /Invalid RGB color/);
  assert.throws(() => rgbArrayToHex('1,2,3'), /Invalid RGB color/);
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

test('normalizePaletteColor rejects mismatched hex and RGB values', () => {
  assert.throws(() => normalizePaletteColor({
    brand: 'MARD',
    code: 'A01',
    name: 'Black',
    hex: '#000000',
    rgb: [255, 255, 255]
  }), /hex and RGB values do not match/);
});

test('normalizePaletteColor rejects invalid supplied RGB values', () => {
  assert.throws(() => normalizePaletteColor({
    brand: 'MARD',
    code: 'BAD',
    hex: '#FF0000',
    rgb: [300, 0, 0]
  }), /Invalid RGB color/);

  assert.throws(() => normalizePaletteColor({
    brand: 'MARD',
    code: 'BAD',
    hex: '#010203',
    rgb: [1.4, 2, 3]
  }), /Invalid RGB color/);
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
