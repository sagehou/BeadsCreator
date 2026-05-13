import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyOutlineToGrid,
  chooseAutoOutlineColor
} from '../src/lib/gridEffects.js';

test('chooseAutoOutlineColor picks white for dark artwork and black for light artwork', () => {
  assert.equal(chooseAutoOutlineColor([
    ['#111111', '#222222'],
    ['#333333', null]
  ]), '#FFFFFF');

  assert.equal(chooseAutoOutlineColor([
    ['#F7D4C0', '#FFE7D9'],
    [null, '#FFFFFF']
  ]), '#000000');
});

test('applyOutlineToGrid adds outline cells around filled artwork without replacing it', () => {
  const grid = [
    [null, null, null],
    [null, '#FF0000', null],
    [null, null, null]
  ];

  assert.deepEqual(applyOutlineToGrid(grid, {
    mode: 'custom',
    color: '#00FF00',
    width: 1
  }), [
    ['#00FF00', '#00FF00', '#00FF00'],
    ['#00FF00', '#FF0000', '#00FF00'],
    ['#00FF00', '#00FF00', '#00FF00']
  ]);
});

test('applyOutlineToGrid supports thicker outlines without growing outside the board', () => {
  const grid = [
    [null, null, null, null],
    [null, null, '#FF0000', null],
    [null, null, null, null],
    [null, null, null, null]
  ];

  const outlined = applyOutlineToGrid(grid, {
    mode: 'black',
    width: 2
  });

  assert.equal(outlined[1][2], '#FF0000');
  assert.equal(outlined[0][0], '#000000');
  assert.equal(outlined[3][3], '#000000');
});
