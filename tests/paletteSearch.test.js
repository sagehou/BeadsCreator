import test from 'node:test';
import assert from 'node:assert/strict';

import { filterPaletteColors } from '../src/lib/paletteSearch.js';

const palette = [
  { code: 'M-R01', name: 'Red', hex: '#F22D41' },
  { code: 'M-B01', name: 'Blue', hex: '#247AD8' },
  { code: 'M-W01', name: 'Warm White', hex: '#F5F4EE' }
];

test('filterPaletteColors matches trimmed lowercase query against code, name, and hex', () => {
  assert.deepEqual(filterPaletteColors(palette, ' r01 '), [palette[0]]);
  assert.deepEqual(filterPaletteColors(palette, 'blue'), [palette[1]]);
  assert.deepEqual(filterPaletteColors(palette, 'f5f4'), [palette[2]]);
});
