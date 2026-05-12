import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findConnectedRegions,
  cleanupSpeckles
} from '../src/lib/gridCleanup.js';
import { normalizePaletteColor } from '../src/lib/colorUtils.js';

const palette = [
  normalizePaletteColor({ brand: 'MARD', code: 'WHITE', name: 'White', hex: '#FFFFFF' }),
  normalizePaletteColor({ brand: 'MARD', code: 'BLACK', name: 'Black', hex: '#000000' }),
  normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#FF0000' })
];

test('findConnectedRegions groups exact-color neighbors with BFS', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#000000'],
    ['#FFFFFF', '#000000', '#000000']
  ];

  const regions = findConnectedRegions(grid);

  assert.equal(regions.length, 2);
  assert.deepEqual(regions.map((region) => region.cells.length).sort((a, b) => a - b), [3, 3]);
});

test('cleanupSpeckles merges single-cell noise into the best neighboring region', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#000000', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF']
  ];

  assert.deepEqual(cleanupSpeckles(grid, palette, { minRegionSize: 2 }), [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF']
  ]);
});

test('cleanupSpeckles recomputes after adjacent small speckles merge', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#000000', '#FF0000', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']
  ];

  assert.deepEqual(cleanupSpeckles(grid, palette, { minRegionSize: 2 }), [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']
  ]);
});

test('cleanupSpeckles uses valid hex fallback for colors missing from palette', () => {
  const grid = [
    ['#111111', '#111111', '#111111', '#111111', '#111111', '#111111'],
    ['#202020', '#222222', '#222222', '#EEEEEE', '#EEEEEE', '#EEEEEE'],
    ['#111111', '#111111', '#111111', '#111111', '#111111', '#111111']
  ];

  assert.deepEqual(cleanupSpeckles(grid, [], { minRegionSize: 2 }), [
    ['#111111', '#111111', '#111111', '#111111', '#111111', '#111111'],
    ['#222222', '#222222', '#222222', '#EEEEEE', '#EEEEEE', '#EEEEEE'],
    ['#111111', '#111111', '#111111', '#111111', '#111111', '#111111']
  ]);
});

test('cleanupSpeckles does not mutate the input grid', () => {
  const grid = [
    ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
    ['#FFFFFF', '#000000', '#FFFFFF'],
    ['#FFFFFF', '#FFFFFF', '#FFFFFF']
  ];
  const original = grid.map((row) => [...row]);

  cleanupSpeckles(grid, palette, { minRegionSize: 2 });

  assert.deepEqual(grid, original);
});

test('cleanupSpeckles leaves large intentional regions intact', () => {
  const grid = [
    ['#FF0000', '#FF0000', '#FFFFFF'],
    ['#FF0000', '#FF0000', '#FFFFFF']
  ];

  assert.deepEqual(cleanupSpeckles(grid, palette, { minRegionSize: 2 }), grid);
});
