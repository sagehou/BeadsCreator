import { findNearestPaletteColor } from './colorUtils.js';

const ALPHA_THRESHOLD = 64;
const MATTE_RGB = [255, 255, 255];

function quantizeChannel(value, bucketSize) {
  return Math.round(value / bucketSize) * bucketSize;
}

function pixelRgb(data, index) {
  const alpha = data[index + 3];
  if (alpha < ALPHA_THRESHOLD) return null;
  if (alpha >= 252) return [data[index], data[index + 1], data[index + 2]];

  const opacity = alpha / 255;
  return [
    Math.round(data[index] * opacity + MATTE_RGB[0] * (1 - opacity)),
    Math.round(data[index + 1] * opacity + MATTE_RGB[1] * (1 - opacity)),
    Math.round(data[index + 2] * opacity + MATTE_RGB[2] * (1 - opacity))
  ];
}

export function dominantRgbForCell(data, width, height, rect, options = {}) {
  const bucketSize = options.bucketSize ?? 16;
  const buckets = new Map();

  const xStart = Math.max(0, Math.floor(rect.xStart));
  const yStart = Math.max(0, Math.floor(rect.yStart));
  const xEnd = Math.min(width, Math.ceil(rect.xEnd));
  const yEnd = Math.min(height, Math.ceil(rect.yEnd));

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const index = (y * width + x) * 4;
      const rgb = pixelRgb(data, index);
      if (!rgb) continue;

      const key = [
        quantizeChannel(rgb[0], bucketSize),
        quantizeChannel(rgb[1], bucketSize),
        quantizeChannel(rgb[2], bucketSize)
      ].join(',');

      const bucket = buckets.get(key) ?? { count: 0, rgbTotal: [0, 0, 0] };
      bucket.count += 1;
      bucket.rgbTotal[0] += rgb[0];
      bucket.rgbTotal[1] += rgb[1];
      bucket.rgbTotal[2] += rgb[2];
      buckets.set(key, bucket);
    }
  }

  if (buckets.size === 0) return null;

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }

  return best.rgbTotal.map((value) => Math.round(value / best.count));
}

export function imageDataToDominantGrid({
  imageData,
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  palette,
  disabledColorIds,
  bucketSize
}) {
  const grid = [];

  for (let y = 0; y < targetHeight; y += 1) {
    const row = [];
    for (let x = 0; x < targetWidth; x += 1) {
      const rect = {
        xStart: (x / targetWidth) * sourceWidth,
        yStart: (y / targetHeight) * sourceHeight,
        xEnd: ((x + 1) / targetWidth) * sourceWidth,
        yEnd: ((y + 1) / targetHeight) * sourceHeight
      };
      const rgb = dominantRgbForCell(imageData, sourceWidth, sourceHeight, rect, { bucketSize });
      row.push(rgb ? findNearestPaletteColor(rgb, palette, { disabledColorIds }).hex : null);
    }
    grid.push(row);
  }

  return grid;
}
