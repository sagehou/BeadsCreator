function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function colorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function pixelOffset(width, x, y) {
  return (y * width + x) * 4;
}

function rgbAt(data, width, x, y) {
  const offset = pixelOffset(width, x, y);
  return [data[offset], data[offset + 1], data[offset + 2]];
}

export function colorSpread(colors) {
  let spread = 0;

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      spread = Math.max(spread, colorDistance(colors[i], colors[j]));
    }
  }

  return Math.round(spread);
}

function edgePreservingSmooth(imageData, width, height, options) {
  const radius = Math.max(0, Math.floor(options.smoothingRadius ?? 1));
  const threshold = Math.max(0, Number(options.colorThreshold ?? 44));
  if (radius <= 0 || threshold <= 0) return new Uint8ClampedArray(imageData);

  const output = new Uint8ClampedArray(imageData.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = pixelOffset(width, x, y);
      const alpha = imageData[offset + 3];
      if (alpha < 64) {
        output[offset] = imageData[offset];
        output[offset + 1] = imageData[offset + 1];
        output[offset + 2] = imageData[offset + 2];
        output[offset + 3] = alpha;
        continue;
      }

      const center = rgbAt(imageData, width, x, y);
      const totals = [0, 0, 0];
      let totalWeight = 0;

      for (let ny = Math.max(0, y - radius); ny <= Math.min(height - 1, y + radius); ny += 1) {
        for (let nx = Math.max(0, x - radius); nx <= Math.min(width - 1, x + radius); nx += 1) {
          const neighborOffset = pixelOffset(width, nx, ny);
          if (imageData[neighborOffset + 3] < 64) continue;

          const neighbor = rgbAt(imageData, width, nx, ny);
          const distance = colorDistance(center, neighbor);
          if (distance > threshold) continue;

          const samePixel = nx === x && ny === y;
          const weight = samePixel ? 2 : 1 - distance / (threshold + 1);
          totals[0] += neighbor[0] * weight;
          totals[1] += neighbor[1] * weight;
          totals[2] += neighbor[2] * weight;
          totalWeight += weight;
        }
      }

      output[offset] = clampChannel(totals[0] / totalWeight);
      output[offset + 1] = clampChannel(totals[1] / totalWeight);
      output[offset + 2] = clampChannel(totals[2] / totalWeight);
      output[offset + 3] = alpha;
    }
  }

  return output;
}

function adjustSaturation(rgb, saturation) {
  const gray = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return [
    gray + (rgb[0] - gray) * saturation,
    gray + (rgb[1] - gray) * saturation,
    gray + (rgb[2] - gray) * saturation
  ];
}

function adjustContrast(rgb, contrast) {
  return rgb.map((channel) => 128 + (channel - 128) * contrast);
}

function posterizeChannel(value, step) {
  if (step <= 1) return clampChannel(value);
  return clampChannel(Math.round(value / step) * step);
}

function stylizeTone(imageData, options) {
  const output = new Uint8ClampedArray(imageData.length);
  const saturation = Math.max(0, Number(options.saturation ?? 1.08));
  const contrast = Math.max(0, Number(options.contrast ?? 1.04));
  const posterizeStep = Math.max(1, Number(options.posterizeStep ?? options.posterizeLevels ?? 12));

  for (let offset = 0; offset < imageData.length; offset += 4) {
    const alpha = imageData[offset + 3];
    if (alpha < 64) {
      output[offset] = imageData[offset];
      output[offset + 1] = imageData[offset + 1];
      output[offset + 2] = imageData[offset + 2];
      output[offset + 3] = alpha;
      continue;
    }

    const saturated = adjustSaturation([
      imageData[offset],
      imageData[offset + 1],
      imageData[offset + 2]
    ], saturation);
    const contrasted = adjustContrast(saturated, contrast);

    output[offset] = posterizeChannel(contrasted[0], posterizeStep);
    output[offset + 1] = posterizeChannel(contrasted[1], posterizeStep);
    output[offset + 2] = posterizeChannel(contrasted[2], posterizeStep);
    output[offset + 3] = alpha;
  }

  return output;
}

export function stylizeImageForBeads({
  imageData,
  width,
  height,
  smoothingRadius,
  colorThreshold,
  posterizeLevels,
  posterizeStep,
  saturation,
  contrast
}) {
  const smoothed = edgePreservingSmooth(imageData, width, height, {
    smoothingRadius,
    colorThreshold
  });

  return stylizeTone(smoothed, {
    posterizeLevels,
    posterizeStep,
    saturation,
    contrast
  });
}
