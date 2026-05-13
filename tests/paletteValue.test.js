import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_SELECTED_COLOR, MARD_COLORS } from '../src/data/colors.js';
import { countBeads } from '../src/hooks/useBeadBoard.js';
import {
  paletteValueForColor,
  resolvePaletteValue,
  hexForPaletteValue
} from '../src/lib/paletteValue.js';

test('duplicate MARD ids with the same hex remain distinguishable in bead counts', () => {
  const q4 = MARD_COLORS.find((color) => color.code === 'Q4');
  const r11 = MARD_COLORS.find((color) => color.code === 'R11');
  const grid = [
    [q4.id, r11.id, r11.id],
    [q4.id, null, '#FFEBFA']
  ];

  const counts = countBeads(grid, MARD_COLORS);
  const byCode = new Map(counts.map((item) => [item.info.code, item]));

  assert.equal(q4.hex, r11.hex);
  assert.equal(byCode.get('Q4').count, 3);
  assert.equal(byCode.get('R11').count, 2);
});

test('palette values resolve duplicate colors by id before hex', () => {
  const q4 = MARD_COLORS.find((color) => color.code === 'Q4');
  const r11 = MARD_COLORS.find((color) => color.code === 'R11');

  assert.equal(paletteValueForColor(r11), r11.id);
  assert.equal(resolvePaletteValue(r11.id, MARD_COLORS), r11);
  assert.equal(resolvePaletteValue(r11.hex, MARD_COLORS), q4);
  assert.equal(hexForPaletteValue(r11.id, MARD_COLORS), r11.hex);
});

test('default selected color is a MARD palette value', () => {
  assert.ok(resolvePaletteValue(DEFAULT_SELECTED_COLOR, MARD_COLORS));
});
