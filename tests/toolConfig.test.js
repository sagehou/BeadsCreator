import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EDITOR_TOOLS,
  toolCursorClass
} from '../src/lib/toolConfig.js';

test('EDITOR_TOOLS keeps a complete stable tool list with SVG icon ids', () => {
  assert.deepEqual(EDITOR_TOOLS.map((tool) => tool.id), [
    'pencil',
    'eraser',
    'bucket',
    'eyedropper',
    'text',
    'select'
  ]);
  assert.ok(EDITOR_TOOLS.every((tool) => tool.icon && !/\p{Emoji}/u.test(tool.icon)));
});

test('toolCursorClass maps selected tools to explicit canvas cursor classes', () => {
  assert.equal(toolCursorClass('pencil'), 'cursor-pencil');
  assert.equal(toolCursorClass('eraser'), 'cursor-eraser');
  assert.equal(toolCursorClass('bucket'), 'cursor-bucket');
  assert.equal(toolCursorClass('eyedropper'), 'cursor-eyedropper');
  assert.equal(toolCursorClass('text'), 'cursor-text');
  assert.equal(toolCursorClass('select'), 'cursor-select');
  assert.equal(toolCursorClass('unknown'), 'cursor-pencil');
});
