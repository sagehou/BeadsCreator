/**
 * K-Means clustering Web Worker
 * Runs color quantization off the main thread to prevent UI blocking.
 */

/**
 * Euclidean distance squared between two RGB colors
 */
function colorDistSq(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

/**
 * K-Means++ initialization
 */
function initCentroids(pixels, k) {
  const centroids = [];
  const idx = Math.floor(Math.random() * pixels.length);
  centroids.push([...pixels[idx]]);

  for (let c = 1; c < k; c++) {
    const dists = pixels.map(p => {
      let minD = Infinity;
      for (const cent of centroids) {
        const d = colorDistSq(p, cent);
        if (d < minD) minD = d;
      }
      return minD;
    });
    const totalDist = dists.reduce((s, d) => s + d, 0);
    let r = Math.random() * totalDist;
    for (let i = 0; i < pixels.length; i++) {
      r -= dists[i];
      if (r <= 0) {
        centroids.push([...pixels[i]]);
        break;
      }
    }
    if (centroids.length <= c) {
      centroids.push([...pixels[Math.floor(Math.random() * pixels.length)]]);
    }
  }
  return centroids;
}

/**
 * Run K-Means clustering
 */
function kMeans(pixels, k, maxIter = 20) {
  if (pixels.length === 0) return [];

  const actualK = Math.min(k, pixels.length);
  let centroids = initCentroids(pixels, actualK);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign pixels to nearest centroid
    const clusters = Array.from({ length: actualK }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const d = colorDistSq(pixel, centroids[i]);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      clusters[minIdx].push(pixel);
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < actualK; i++) {
      if (clusters[i].length === 0) continue;
      const newCentroid = [0, 0, 0];
      for (const p of clusters[i]) {
        newCentroid[0] += p[0];
        newCentroid[1] += p[1];
        newCentroid[2] += p[2];
      }
      newCentroid[0] = Math.round(newCentroid[0] / clusters[i].length);
      newCentroid[1] = Math.round(newCentroid[1] / clusters[i].length);
      newCentroid[2] = Math.round(newCentroid[2] / clusters[i].length);

      if (colorDistSq(centroids[i], newCentroid) > 1) {
        converged = false;
      }
      centroids[i] = newCentroid;
    }

    if (converged) break;

    // Report progress
    self.postMessage({
      type: 'progress',
      progress: Math.round(((iter + 1) / maxIter) * 50)
    });
  }

  return centroids;
}

/**
 * Apply Laplacian edge detection
 */
function detectEdges(imageData, width, height) {
  const kernel = [
    0, -1, 0,
    -1, 4, -1,
    0, -1, 0
  ];

  const edges = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
          sum += gray * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      edges[y * width + x] = Math.abs(sum);
    }
  }

  // Normalize
  let maxEdge = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > maxEdge) maxEdge = edges[i];
  }
  if (maxEdge > 0) {
    for (let i = 0; i < edges.length; i++) {
      edges[i] /= maxEdge;
    }
  }

  return edges;
}

/**
 * Find closest color from palette using Euclidean distance
 */
function findClosestPaletteColor(r, g, b, palette) {
  let minDist = Infinity;
  let closestIdx = 0;

  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    const dist = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  return closestIdx;
}

/**
 * Main message handler
 */
self.onmessage = function (e) {
  const { imageData, width, height, paletteHexColors, maxColors, enhanceEdges } = e.data;

  try {
    // Step 1: Extract pixel data
    const pixels = [];
    for (let i = 0; i < imageData.length; i += 4) {
      pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
    }

    self.postMessage({ type: 'progress', progress: 5 });

    // Step 2: K-Means quantization
    const centroids = kMeans(pixels, maxColors);

    self.postMessage({ type: 'progress', progress: 55 });

    // Step 3: Parse palette colors to RGB
    const paletteRgb = paletteHexColors.map(hex => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ]);

    // Step 4: Edge detection if enabled
    let edges = null;
    if (enhanceEdges) {
      edges = detectEdges(imageData, width, height);
    }

    self.postMessage({ type: 'progress', progress: 65 });

    // Step 5: Map each pixel to nearest centroid, then to palette color
    const result = new Array(width * height);

    for (let i = 0; i < pixels.length; i++) {
      // Find nearest centroid
      let minDist = Infinity;
      let nearestCentroid = centroids[0];
      for (const c of centroids) {
        const d = colorDistSq(pixels[i], c);
        if (d < minDist) {
          minDist = d;
          nearestCentroid = c;
        }
      }

      let r = nearestCentroid[0];
      let g = nearestCentroid[1];
      let b = nearestCentroid[2];

      // Edge enhancement: bias towards darker colors for edge pixels
      if (edges && edges[i] > 0.3) {
        const edgeWeight = edges[i] * 0.5;
        r = Math.round(r * (1 - edgeWeight));
        g = Math.round(g * (1 - edgeWeight));
        b = Math.round(b * (1 - edgeWeight));
      }

      // Map to closest palette color
      result[i] = findClosestPaletteColor(r, g, b, paletteRgb);

      if (i % 100 === 0) {
        self.postMessage({
          type: 'progress',
          progress: 65 + Math.round((i / pixels.length) * 30)
        });
      }
    }

    self.postMessage({ type: 'progress', progress: 98 });

    // Return result as palette indices
    self.postMessage({
      type: 'complete',
      result: result,
      width: width,
      height: height
    });

  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
