import test from 'node:test';
import assert from 'node:assert/strict';

import { limitGridToTopColors } from '../src/lib/gridPaletteLimit.js';

const palette = [
  { hex: '#000000', rgb: [0, 0, 0] },
  { hex: '#101010', rgb: [16, 16, 16] },
  { hex: '#FF0000', rgb: [255, 0, 0] },
  { hex: '#FF2020', rgb: [255, 32, 32] }
];

test('limitGridToTopColors keeps frequent colors and remaps rare colors to nearest kept color', () => {
  const grid = [
    ['#000000', '#000000', '#FF0000'],
    ['#000000', '#101010', '#FF2020']
  ];

  assert.deepEqual(limitGridToTopColors(grid, palette, 2), [
    ['#000000', '#000000', '#FF0000'],
    ['#000000', '#000000', '#FF0000']
  ]);
});

test('limitGridToTopColors returns the same grid when already within the target color count', () => {
  const grid = [
    ['#000000', '#FF0000'],
    ['#000000', null]
  ];

  assert.equal(limitGridToTopColors(grid, palette, 2), grid);
});
