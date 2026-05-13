import test from 'node:test';
import assert from 'node:assert/strict';

import {
  groupPaletteByColorFamily,
  sortPaletteByColorFamily,
  sortPaletteByMardCode
} from '../src/lib/paletteSorting.js';

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

test('sortPaletteByColorFamily follows rainbow order before pink, brown, and neutrals', () => {
  const palette = [
    { code: 'NBLACK', hex: '#1D1414' },
    { code: 'WARMWHITE', hex: '#F1EDED' },
    { code: 'BROWN', hex: '#8A4526' },
    { code: 'PINK', hex: '#F551A2' },
    { code: 'PURPLE', hex: '#8854B3' },
    { code: 'BLUE', hex: '#2158D6' },
    { code: 'CYAN', hex: '#28DDDE' },
    { code: 'GREEN', hex: '#2FA85A' },
    { code: 'YELLOW', hex: '#F5D43A' },
    { code: 'ORANGE', hex: '#F77C31' },
    { code: 'RED', hex: '#EF3340' }
  ];

  assert.deepEqual(
    sortPaletteByColorFamily(palette).map((color) => color.code),
    ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'CYAN', 'BLUE', 'PURPLE', 'PINK', 'BROWN', 'WARMWHITE', 'NBLACK']
  );
});

test('sortPaletteByMardCode uses natural MARD code naming order', () => {
  const palette = [
    { code: 'A10', hex: '#000000' },
    { code: 'ZG2', hex: '#000000' },
    { code: 'A2', hex: '#000000' },
    { code: 'B1', hex: '#000000' },
    { code: 'A1', hex: '#000000' },
    { code: 'ZG1', hex: '#000000' }
  ];

  assert.deepEqual(
    sortPaletteByMardCode(palette).map((color) => color.code),
    ['A1', 'A2', 'A10', 'B1', 'ZG1', 'ZG2']
  );
});

test('groupPaletteByColorFamily returns non-empty family sections in visual order', () => {
  const palette = [
    { code: 'NBLACK', hex: '#1D1414' },
    { code: 'BROWN', hex: '#8A4526' },
    { code: 'PURPLE', hex: '#8854B3' },
    { code: 'BLUE', hex: '#2158D6' },
    { code: 'CYAN', hex: '#28DDDE' },
    { code: 'GREEN', hex: '#2FA85A' },
    { code: 'YELLOW', hex: '#F5D43A' },
    { code: 'ORANGE', hex: '#F77C31' },
    { code: 'RED', hex: '#EF3340' }
  ];

  assert.deepEqual(
    groupPaletteByColorFamily(palette).map((group) => ({
      id: group.id,
      label: group.label,
      codes: group.colors.map((color) => color.code)
    })),
    [
      { id: 'red', label: '红', codes: ['RED'] },
      { id: 'orange', label: '橙', codes: ['ORANGE'] },
      { id: 'yellow', label: '黄', codes: ['YELLOW'] },
      { id: 'green', label: '绿', codes: ['GREEN'] },
      { id: 'cyan', label: '青', codes: ['CYAN'] },
      { id: 'blue', label: '蓝', codes: ['BLUE'] },
      { id: 'purple', label: '紫', codes: ['PURPLE'] },
      { id: 'brown', label: '棕', codes: ['BROWN'] },
      { id: 'neutral', label: '黑白灰', codes: ['NBLACK'] }
    ]
  );
});
