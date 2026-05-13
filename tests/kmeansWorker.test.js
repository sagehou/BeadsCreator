import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizePaletteColor } from '../src/lib/colorUtils.js';

const palette = [
  normalizePaletteColor({ brand: 'MARD', code: 'BLACK', name: 'Black', hex: '#000000' }),
  normalizePaletteColor({ brand: 'MARD', code: 'RED', name: 'Red', hex: '#FF0000' })
];

const skinNoisePalette = [
  normalizePaletteColor({ brand: 'MARD', code: 'SKIN-A', name: 'Skin A', hex: '#F5C6AB' }),
  normalizePaletteColor({ brand: 'MARD', code: 'SKIN-Q', name: 'Skin Q', hex: '#FCCCA8' })
];

let workerImportCounter = 0;

function imageDataFromPixels(pixels) {
  return new Uint8ClampedArray(pixels.flatMap(([r, g, b, a = 255]) => [r, g, b, a]));
}

async function loadWorker() {
  const messages = [];
  globalThis.self = {
    postMessage(message) {
      messages.push(message);
    }
  };

  workerImportCounter += 1;
  await import(`../src/workers/kmeansWorker.js?test=${workerImportCounter}`);

  return {
    messages,
    post(data) {
      messages.length = 0;
      globalThis.self.onmessage({ data });
      return messages;
    }
  };
}

test('worker converts image data to a dominant sampled result grid', async () => {
  const worker = await loadWorker();
  const messages = worker.post({
    imageData: imageDataFromPixels([
      [0, 0, 0],
      [255, 0, 0]
    ]),
    sourceWidth: 2,
    sourceHeight: 1,
    width: 2,
    height: 1,
    paletteColors: palette,
    cleanupThreshold: 0,
    bucketSize: 16
  });

  assert.deepEqual(messages.map((message) => message.type), [
    'progress',
    'progress',
    'progress',
    'complete'
  ]);
  assert.deepEqual(messages.map((message) => message.progress).filter(Boolean), [10, 75, 98]);
  assert.deepEqual(messages.at(-1), {
    type: 'complete',
    resultGrid: [['#000000', '#FF0000']],
    width: 2,
    height: 1
  });
});

test('worker applies Q-style preprocessing before dominant sampling by default', async () => {
  const worker = await loadWorker();
  const messages = worker.post({
    imageData: imageDataFromPixels([
      [245, 198, 171],
      [250, 203, 177]
    ]),
    sourceWidth: 2,
    sourceHeight: 1,
    width: 2,
    height: 1,
    paletteColors: skinNoisePalette,
    cleanupThreshold: 0,
    bucketSize: 1
  });

  assert.deepEqual(messages.at(-1), {
    type: 'complete',
    resultGrid: [['#FCCCA8', '#FCCCA8']],
    width: 2,
    height: 1
  });
});

test('worker supports legacy paletteHexColors input with palette index result output', async () => {
  const worker = await loadWorker();
  const messages = worker.post({
    imageData: imageDataFromPixels([
      [0, 0, 0],
      [255, 0, 0]
    ]),
    width: 2,
    height: 1,
    paletteHexColors: ['#000000', '#FF0000'],
    maxColors: 16,
    enhanceEdges: false
  });

  assert.deepEqual(messages.map((message) => message.type), [
    'progress',
    'progress',
    'progress',
    'complete'
  ]);
  assert.deepEqual(messages.at(-1), {
    type: 'complete',
    result: [0, 1],
    width: 2,
    height: 1
  });
});

test('worker preserves legacy maxColors behavior for paletteHexColors callers', async () => {
  const worker = await loadWorker();
  const legacyMessage = {
    imageData: imageDataFromPixels([
      [255, 0, 0],
      [0, 0, 255]
    ]),
    width: 2,
    height: 1,
    paletteHexColors: ['#FF0000', '#0000FF'],
    enhanceEdges: false
  };

  const oneColorComplete = worker.post({
    ...legacyMessage,
    maxColors: 1
  }).at(-1);
  const twoColorComplete = worker.post({
    ...legacyMessage,
    maxColors: 2
  }).at(-1);

  assert.deepEqual(oneColorComplete, {
    type: 'complete',
    result: [0, 0],
    width: 2,
    height: 1
  });
  assert.deepEqual(twoColorComplete, {
    type: 'complete',
    result: [0, 1],
    width: 2,
    height: 1
  });
});

test('worker posts an error message when conversion fails', async () => {
  const worker = await loadWorker();
  const messages = worker.post({
    imageData: imageDataFromPixels([[0, 0, 0]]),
    sourceWidth: 1,
    sourceHeight: 1,
    width: 1,
    height: 1
  });

  assert.equal(messages.at(-1).type, 'error');
  assert.equal(typeof messages.at(-1).error, 'string');
  assert.ok(messages.at(-1).error.length > 0);
});
