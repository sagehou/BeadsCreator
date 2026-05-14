import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
  clampBoardSize
} from '../src/lib/boardSize.js';

test('clampBoardSize supports 58x58 boards and clamps unsafe values', () => {
  assert.equal(MIN_BOARD_SIZE, 10);
  assert.equal(MAX_BOARD_SIZE, 58);
  assert.equal(clampBoardSize(4), 10);
  assert.equal(clampBoardSize(50), 50);
  assert.equal(clampBoardSize(58), 58);
  assert.equal(clampBoardSize(99), 58);
});
