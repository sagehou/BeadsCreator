import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProjectFile,
  loadBoardState,
  parseProjectFile,
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

test('createProjectFile writes a versioned portable board file', () => {
  const exported = createProjectFile({
    grid: [
      ['MARD:A1', null],
      [null, 'MARD:B2']
    ],
    gridSize: { rows: 2, cols: 2 },
    selectedColor: 'MARD:B2',
    recentColors: ['MARD:B2', 'bad', 'MARD:A1']
  }, {
    exportedAt: '2026-05-13T00:00:00.000Z'
  });

  assert.deepEqual(JSON.parse(exported), {
    app: 'BeadsCreator',
    version: 1,
    exportedAt: '2026-05-13T00:00:00.000Z',
    board: {
      grid: [
        ['MARD:A1', null],
        [null, 'MARD:B2']
      ],
      gridSize: { rows: 2, cols: 2 },
      selectedColor: 'MARD:B2',
      recentColors: ['MARD:B2', 'bad', 'MARD:A1']
    }
  });
});

test('parseProjectFile loads versioned project files and legacy board JSON', () => {
  const board = {
    grid: [['MARD:A1']],
    gridSize: { rows: 1, cols: 1 },
    selectedColor: 'MARD:A1',
    recentColors: ['MARD:A1']
  };

  assert.deepEqual(parseProjectFile(JSON.stringify({
    app: 'BeadsCreator',
    version: 1,
    board
  })), board);

  assert.deepEqual(parseProjectFile(JSON.stringify(board)), board);
});

test('parseProjectFile rejects invalid files without throwing', () => {
  assert.equal(parseProjectFile('{bad-json'), null);
  assert.equal(parseProjectFile(JSON.stringify({
    app: 'BeadsCreator',
    version: 99,
    board: { grid: [['MARD:A1']] }
  })), null);
  assert.equal(parseProjectFile(JSON.stringify({
    app: 'BeadsCreator',
    version: 1,
    board: { grid: [['MARD:A1'], ['MARD:B1', null]] }
  })), null);
});
