import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearSelection,
  extractSelection,
  flipSelectionHorizontal,
  flipSelectionVertical,
  moveSelection,
  normalizeSelectionRect,
  pointInRect
} from '../src/lib/selectionGrid.js';

test('normalizeSelectionRect accepts drags in any direction', () => {
  assert.deepEqual(normalizeSelectionRect({ x: 4, y: 3 }, { x: 1, y: 2 }), {
    x: 1,
    y: 2,
    width: 4,
    height: 2
  });
});

test('extractSelection and clearSelection preserve grid shape', () => {
  const grid = [
    ['A', 'B', 'C'],
    ['D', 'E', 'F'],
    ['G', 'H', 'I']
  ];
  const rect = { x: 1, y: 0, width: 2, height: 2 };

  assert.deepEqual(extractSelection(grid, rect), [
    ['B', 'C'],
    ['E', 'F']
  ]);
  assert.deepEqual(clearSelection(grid, rect), [
    ['A', null, null],
    ['D', null, null],
    ['G', 'H', 'I']
  ]);
});

test('moveSelection clears the source and stamps content at a clipped destination', () => {
  const grid = [
    ['A', 'B', 'C', null],
    ['D', 'E', 'F', null],
    ['G', 'H', 'I', null]
  ];

  assert.deepEqual(moveSelection(grid, {
    x: 1,
    y: 0,
    width: 2,
    height: 2
  }, { x: 2, y: 1 }), {
    grid: [
      ['A', null, null, null],
      ['D', null, 'B', 'C'],
      ['G', 'H', 'E', 'F']
    ],
    rect: {
      x: 2,
      y: 1,
      width: 2,
      height: 2
    }
  });
});

test('pointInRect detects whether a bead is inside a selection', () => {
  const rect = { x: 2, y: 3, width: 4, height: 2 };

  assert.equal(pointInRect({ x: 2, y: 3 }, rect), true);
  assert.equal(pointInRect({ x: 5, y: 4 }, rect), true);
  assert.equal(pointInRect({ x: 6, y: 4 }, rect), false);
});

test('flipSelectionHorizontal and flipSelectionVertical mirror copied selection content', () => {
  const content = [
    ['A', null, 'B'],
    ['C', 'D', null]
  ];

  assert.deepEqual(flipSelectionHorizontal(content), [
    ['B', null, 'A'],
    [null, 'D', 'C']
  ]);
  assert.deepEqual(flipSelectionVertical(content), [
    ['C', 'D', null],
    ['A', null, 'B']
  ]);
  assert.deepEqual(content, [
    ['A', null, 'B'],
    ['C', 'D', null]
  ]);
});
