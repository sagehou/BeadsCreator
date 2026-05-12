import test from 'node:test';
import assert from 'node:assert/strict';

import { hexToRgbArray, rgbArrayToHex } from '../src/lib/colorUtils.js';

test('hexToRgbArray and rgbArrayToHex round-trip uppercase hex colors', () => {
  assert.deepEqual(hexToRgbArray('#1a2b3c'), [26, 43, 60]);
  assert.equal(rgbArrayToHex([26, 43, 60]), '#1A2B3C');
});
