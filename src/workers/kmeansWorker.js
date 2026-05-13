import { imageDataToDominantGrid } from '../lib/dominantSampling.js';
import { cleanupSpeckles } from '../lib/gridCleanup.js';
import { applyOutlineToGrid } from '../lib/gridEffects.js';
import { stylizeImageForBeads } from '../lib/imagePreprocess.js';

function colorDistSq(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function uniquePixels(pixels) {
  const seen = new Set();
  const unique = [];

  for (const pixel of pixels) {
    const key = pixel.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(pixel);
  }

  return unique;
}

function initCentroids(pixels, k) {
  const centroids = [pixels[0]];
  const candidates = uniquePixels(pixels);

  while (centroids.length < k) {
    let next = null;
    let nextDistance = -1;

    for (const pixel of candidates) {
      const minDistance = Math.min(...centroids.map((centroid) => colorDistSq(pixel, centroid)));
      if (minDistance > nextDistance) {
        next = pixel;
        nextDistance = minDistance;
      }
    }

    if (!next || centroids.some((centroid) => colorDistSq(centroid, next) === 0)) break;
    centroids.push(next);
  }

  while (centroids.length < k) {
    centroids.push(pixels[centroids.length % pixels.length]);
  }

  return centroids.map((pixel) => [...pixel]);
}

function kMeans(pixels, k, maxIter = 20) {
  if (pixels.length === 0) return [];

  const actualK = Math.max(1, Math.min(k, pixels.length));
  const centroids = initCentroids(pixels, actualK);

  for (let iter = 0; iter < maxIter; iter += 1) {
    const clusters = Array.from({ length: actualK }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < centroids.length; i += 1) {
        const dist = colorDistSq(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      clusters[minIdx].push(pixel);
    }

    let converged = true;
    for (let i = 0; i < actualK; i += 1) {
      if (clusters[i].length === 0) continue;
      const nextCentroid = [0, 0, 0];
      for (const pixel of clusters[i]) {
        nextCentroid[0] += pixel[0];
        nextCentroid[1] += pixel[1];
        nextCentroid[2] += pixel[2];
      }
      nextCentroid[0] = Math.round(nextCentroid[0] / clusters[i].length);
      nextCentroid[1] = Math.round(nextCentroid[1] / clusters[i].length);
      nextCentroid[2] = Math.round(nextCentroid[2] / clusters[i].length);

      if (colorDistSq(centroids[i], nextCentroid) > 1) converged = false;
      centroids[i] = nextCentroid;
    }

    if (converged) break;
  }

  return centroids;
}

function detectEdges(imageData, width, height) {
  const kernel = [
    0, -1, 0,
    -1, 4, -1,
    0, -1, 0
  ];
  const edges = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
          sum += gray * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      edges[y * width + x] = Math.abs(sum);
    }
  }

  let maxEdge = 0;
  for (let i = 0; i < edges.length; i += 1) {
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  if (maxEdge > 0) {
    for (let i = 0; i < edges.length; i += 1) edges[i] /= maxEdge;
  }

  return edges;
}

function findClosestPaletteColor(rgb, palette) {
  let minDist = Infinity;
  let closestIdx = 0;

  for (let i = 0; i < palette.length; i += 1) {
    const dist = colorDistSq(rgb, palette[i]);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  return closestIdx;
}

function legacyPaletteFromHexColors(hexColors) {
  return hexColors.map((hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]);
}

function nearestCentroid(pixel, centroids) {
  let best = centroids[0];
  let bestDistance = colorDistSq(pixel, best);

  for (let i = 1; i < centroids.length; i += 1) {
    const distance = colorDistSq(pixel, centroids[i]);
    if (distance < bestDistance) {
      best = centroids[i];
      bestDistance = distance;
    }
  }

  return best;
}

function legacyConvertToPaletteIndices({
  imageData,
  width,
  height,
  paletteHexColors,
  maxColors,
  enhanceEdges
}) {
  const pixels = [];
  for (let i = 0; i < imageData.length; i += 4) {
    pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
  }

  const centroids = kMeans(pixels, maxColors);
  const palette = legacyPaletteFromHexColors(paletteHexColors);
  const edges = enhanceEdges ? detectEdges(imageData, width, height) : null;

  return pixels.map((pixel, index) => {
    const centroid = [...nearestCentroid(pixel, centroids)];
    if (edges && edges[index] > 0.3) {
      const edgeWeight = edges[index] * 0.5;
      centroid[0] = Math.round(centroid[0] * (1 - edgeWeight));
      centroid[1] = Math.round(centroid[1] * (1 - edgeWeight));
      centroid[2] = Math.round(centroid[2] * (1 - edgeWeight));
    }
    return findClosestPaletteColor(centroid, palette);
  });
}

self.onmessage = function (e) {
  const {
    imageData,
    sourceWidth,
    sourceHeight,
    width,
    height,
    paletteColors,
    paletteHexColors,
    maxColors = 16,
    enhanceEdges = false,
    cleanupThreshold = 0,
    bucketSize = 16,
    preprocessMode = 'cartoon',
    outlineMode = 'none',
    outlineColor = '#000000',
    outlineWidth = 1
  } = e.data;

  try {
    const usesLegacyContract = !paletteColors && paletteHexColors;

    self.postMessage({ type: 'progress', progress: 10 });

    if (usesLegacyContract) {
      const result = legacyConvertToPaletteIndices({
        imageData,
        width,
        height,
        paletteHexColors,
        maxColors,
        enhanceEdges
      });

      self.postMessage({ type: 'progress', progress: 75 });
      self.postMessage({ type: 'progress', progress: 98 });
      self.postMessage({
        type: 'complete',
        result,
        width,
        height
      });
      return;
    }

    const actualSourceWidth = sourceWidth ?? width;
    const actualSourceHeight = sourceHeight ?? height;
    const preparedImageData = preprocessMode === 'none'
      ? imageData
      : stylizeImageForBeads({
        imageData,
        width: actualSourceWidth,
        height: actualSourceHeight,
        smoothingRadius: 1,
        colorThreshold: 44,
        posterizeStep: 12,
        saturation: 1.08,
        contrast: 1.04,
        detailSpread: 1,
        detailStrength: 0.42,
        detailThreshold: 48
      });

    const grid = imageDataToDominantGrid({
      imageData: preparedImageData,
      sourceWidth: actualSourceWidth,
      sourceHeight: actualSourceHeight,
      targetWidth: width,
      targetHeight: height,
      palette: paletteColors,
      bucketSize
    });

    self.postMessage({ type: 'progress', progress: 75 });

    const cleanupLevel = Math.max(0, Number(cleanupThreshold) || 0);
    const cleanedGrid = cleanupLevel > 0
      ? cleanupSpeckles(grid, paletteColors, {
        minRegionSize: cleanupLevel + 1,
        similarityThreshold: 12 + cleanupLevel * 10
      })
      : grid;
    const resultGrid = applyOutlineToGrid(cleanedGrid, {
      mode: outlineMode,
      color: outlineColor,
      width: outlineWidth
    });

    self.postMessage({ type: 'progress', progress: 98 });
    self.postMessage({
      type: 'complete',
      resultGrid,
      width,
      height
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
