function pixelOffset(width, x, y) {
  return (y * width + x) * 4;
}

function srgbToLinear(value) {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function rgbToLab(r, g, b) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;

  const f = (value) => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz)
  ];
}

function labDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function averageLab(labs) {
  const total = labs.reduce((acc, lab) => {
    acc[0] += lab[0];
    acc[1] += lab[1];
    acc[2] += lab[2];
    return acc;
  }, [0, 0, 0]);

  return total.map((value) => value / labs.length);
}

function edgeSamplePoints(width, height) {
  return [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
    [Math.floor(width / 2), height - 1],
    [width - 1, Math.floor(height / 2)]
  ];
}

export function removeBackgroundFromImageData({
  imageData,
  width,
  height,
  clusterRadius = 14,
  consensus = 5,
  hardThreshold = 16,
  softThreshold = 26
}) {
  if (!imageData || width <= 0 || height <= 0) return null;

  const samples = edgeSamplePoints(width, height).map(([x, y]) => {
    const offset = pixelOffset(width, x, y);
    return rgbToLab(imageData[offset], imageData[offset + 1], imageData[offset + 2]);
  });

  let bestCluster = [];
  for (let i = 0; i < samples.length; i += 1) {
    const cluster = samples.filter((sample) => labDistance(samples[i], sample) < clusterRadius);
    if (cluster.length > bestCluster.length) bestCluster = cluster;
  }

  if (bestCluster.length < consensus) return null;

  const backgroundLab = averageLab(bestCluster);
  const total = width * height;
  const near = new Uint8Array(total);
  const distances = new Float32Array(total);

  for (let p = 0; p < total; p += 1) {
    const offset = p * 4;
    if (imageData[offset + 3] < 64) continue;

    const distance = labDistance(
      rgbToLab(imageData[offset], imageData[offset + 1], imageData[offset + 2]),
      backgroundLab
    );
    distances[p] = distance;
    if (distance < hardThreshold) near[p] = 1;
    else if (distance < softThreshold) near[p] = 2;
  }

  const reachable = new Uint8Array(total);
  const queue = [];
  const seed = (p) => {
    if (near[p] === 0 || reachable[p]) return;
    reachable[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const p = queue[head];
    const x = p % width;
    const y = Math.floor(p / width);
    if (x > 0) seed(p - 1);
    if (x < width - 1) seed(p + 1);
    if (y > 0) seed(p - width);
    if (y < height - 1) seed(p + width);
  }

  const output = new Uint8ClampedArray(imageData);
  let removed = 0;
  for (let p = 0; p < total; p += 1) {
    if (!reachable[p]) continue;

    const offset = p * 4;
    if (near[p] === 1) {
      output[offset + 3] = 0;
    } else {
      const opacity = (distances[p] - hardThreshold) / (softThreshold - hardThreshold);
      output[offset + 3] = Math.min(output[offset + 3], Math.round(opacity * 255));
    }
    removed += 1;
  }

  return removed > 0 ? output : null;
}

export function estimateImageComplexity({ imageData, width, height, sampleSize = 64 }) {
  if (!imageData || width <= 1 || height <= 1) return 0;

  const stepX = Math.max(1, Math.floor(width / sampleSize));
  const stepY = Math.max(1, Math.floor(height / sampleSize));
  let total = 0;
  let count = 0;

  for (let y = 0; y < height - stepY; y += stepY) {
    for (let x = 0; x < width - stepX; x += stepX) {
      const offset = pixelOffset(width, x, y);
      const right = pixelOffset(width, x + stepX, y);
      const down = pixelOffset(width, x, y + stepY);
      total += Math.abs(imageData[offset] - imageData[right]) +
        Math.abs(imageData[offset + 1] - imageData[right + 1]) +
        Math.abs(imageData[offset + 2] - imageData[right + 2]) +
        Math.abs(imageData[offset] - imageData[down]) +
        Math.abs(imageData[offset + 1] - imageData[down + 1]) +
        Math.abs(imageData[offset + 2] - imageData[down + 2]);
      count += 1;
    }
  }

  return count > 0 ? total / count : 0;
}

export function suggestBoardSizeForComplexity(complexity, currentSize) {
  if (currentSize >= 58) return null;
  if (complexity > 70 && currentSize < 58) return 58;
  if (complexity > 40 && currentSize < 50) return 50;
  return null;
}
