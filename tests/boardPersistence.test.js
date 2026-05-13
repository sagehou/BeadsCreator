import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadBoardState,
  saveBoardState
} from '../src/lib/boardPersistence.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('board state round-trips through storage without replacing imported grids', () => {
  const storage = createStorage();
  const importedGrid = [
    ['MARD:Q4', null],
    [null, 'MARD:R11']
  ];

  saveBoardState(storage, {
    grid: importedGrid,
    gridSize: { rows: 2, cols: 2 },
    selectedColor: 'MARD:R11',
    recentColors: ['MARD:R11']
  });

  assert.deepEqual(loadBoardState(storage), {
    grid: importedGrid,
    gridSize: { rows: 2, cols: 2 },
    selectedColor: 'MARD:R11',
    recentColors: ['MARD:R11']
  });
});

test('loadBoardState ignores invalid stored grids', () => {
  const storage = createStorage();
  storage.setItem('beadscreator.board.v1', JSON.stringify({
    grid: [['#000000'], ['#FFFFFF', '#FC283C']],
    gridSize: { rows: 2, cols: 1 }
  }));

  assert.equal(loadBoardState(storage), null);
});
