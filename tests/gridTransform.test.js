import test from 'node:test';
import assert from 'node:assert/strict';

import { mirrorGridHorizontal } from '../src/lib/gridTransform.js';

test('mirrorGridHorizontal flips every row left to right without mutating the source', () => {
  const grid = [
    ['A', null, 'B'],
    ['C', 'D', null]
  ];
  const original = grid.map((row) => [...row]);

  assert.deepEqual(mirrorGridHorizontal(grid), [
    ['B', null, 'A'],
    [null, 'D', 'C']
  ]);
  assert.deepEqual(grid, original);
});
