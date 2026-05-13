import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampCanvasScale,
  fitCanvasView,
  nextCanvasScale
} from '../src/lib/canvasView.js';

test('clampCanvasScale keeps zoom within the supported editor range', () => {
  assert.equal(clampCanvasScale(0.1), 0.3);
  assert.equal(clampCanvasScale(1.25), 1.25);
  assert.equal(clampCanvasScale(8), 5);
});

test('nextCanvasScale applies zoom steps and clamps the result', () => {
  assert.equal(nextCanvasScale(1, 1), 1.1);
  assert.equal(nextCanvasScale(1, -1), 0.9);
  assert.equal(nextCanvasScale(4.96, 1), 5);
  assert.equal(nextCanvasScale(0.31, -1), 0.3);
});

test('fitCanvasView centers a board inside the available viewport', () => {
  assert.deepEqual(
    fitCanvasView({
      rows: 20,
      cols: 30,
      cellSize: 18,
      viewportWidth: 900,
      viewportHeight: 600
    }),
    {
      scale: 1,
      offset: { x: 180, y: 120 }
    }
  );
});

test('fitCanvasView scales down large boards with padding', () => {
  const view = fitCanvasView({
    rows: 50,
    cols: 50,
    cellSize: 18,
    viewportWidth: 500,
    viewportHeight: 400,
    padding: 40
  });

  assert.equal(view.scale, 0.36);
  assert.deepEqual(view.offset, { x: 88, y: 38 });
});
