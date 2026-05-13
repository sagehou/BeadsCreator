import test from 'node:test';
import assert from 'node:assert/strict';

import { sortPaletteByColorFamily } from '../src/lib/paletteSorting.js';

test('sortPaletteByColorFamily groups colors by visible color family', () => {
  const palette = [
    { code: 'B', hex: '#2158D6', rgb: [33, 88, 214] },
    { code: 'R', hex: '#EF3340', rgb: [239, 51, 64] },
    { code: 'G', hex: '#2FA85A', rgb: [47, 168, 90] },
    { code: 'Y', hex: '#F5D43A', rgb: [245, 212, 58] },
    { code: 'N', hex: '#F4F4F4', rgb: [244, 244, 244] }
  ];

  assert.deepEqual(
    sortPaletteByColorFamily(palette).map((color) => color.code),
    ['R', 'Y', 'G', 'B', 'N']
  );
});
