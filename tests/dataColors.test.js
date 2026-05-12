import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HAMA_COLORS,
  MARD_COLORS,
  PERLER_COLORS,
  findClosestColor,
  generateRandomStarterPattern,
  generateSmileyPattern,
  getAllColors,
  getPaletteBrands,
  hexToRgb
} from '../src/data/colors.js';
import { PALETTE_BRANDS } from '../src/data/mardColors.js';

test('getAllColors returns MARD palette by default and exposes compatibility aliases', () => {
  assert.equal(getAllColors(), MARD_COLORS);
  assert.equal(PERLER_COLORS, MARD_COLORS);
  assert.equal(HAMA_COLORS, MARD_COLORS);
});

test('getPaletteBrands returns the palette brand registry', () => {
  assert.equal(getPaletteBrands(), PALETTE_BRANDS);
});

test('findClosestColor delegates to the normalized MARD palette matcher', () => {
  const match = findClosestColor(245, 244, 238);

  assert.equal(match.code, 'M-W01');
  assert.equal(typeof match.distance, 'number');
});

test('hexToRgb keeps object return shape', () => {
  assert.deepEqual(hexToRgb('#1A2B3C'), { r: 26, g: 43, b: 60 });
});

test('starter pattern compatibility functions return rectangular grids', () => {
  const smiley = generateSmileyPattern();
  const starter = generateRandomStarterPattern(9, 7);

  assert.equal(smiley.length, 29);
  assert.equal(smiley.every((row) => row.length === 29), true);
  assert.equal(smiley.flat().some(Boolean), true);
  assert.equal(starter.length, 9);
  assert.equal(starter.every((row) => row.length === 7), true);
  assert.equal(starter.flat().some(Boolean), true);
});
