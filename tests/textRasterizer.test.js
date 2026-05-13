import test from 'node:test';
import assert from 'node:assert/strict';

import {
  rasterizeTextToGrid,
  stampTextOnGrid
} from '../src/lib/textRasterizer.js';

test('rasterizeTextToGrid converts text to a bead mask using a compact bitmap font', () => {
  const mask = rasterizeTextToGrid('A', { size: 1 });

  assert.equal(mask.length, 7);
  assert.equal(mask[0].join(''), '.###.');
  assert.equal(mask[3].join(''), '#####');
});

test('stampTextOnGrid writes rasterized text at the requested origin', () => {
  const grid = Array.from({ length: 9 }, () => Array(12).fill(null));

  const stamped = stampTextOnGrid(grid, 'HI', {
    x: 1,
    y: 1,
    color: '#123456',
    size: 1
  });

  assert.equal(stamped[1][1], '#123456');
  assert.equal(stamped[4][3], '#123456');
  assert.equal(stamped[4][9], '#123456');
  assert.equal(grid[1][1], null);
});

test('stampTextOnGrid clips text outside board boundaries', () => {
  const grid = Array.from({ length: 3 }, () => Array(3).fill(null));

  const stamped = stampTextOnGrid(grid, 'A', {
    x: -2,
    y: -2,
    color: '#000000',
    size: 1
  });

  assert.equal(stamped.length, 3);
  assert.equal(stamped[0].length, 3);
  assert.ok(stamped.some((row) => row.some(Boolean)));
});
