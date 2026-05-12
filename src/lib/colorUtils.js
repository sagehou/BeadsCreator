const NEUTRAL_CHROMA_THRESHOLD = 28;

export function hexToRgbArray(hex) {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

export function rgbArrayToHex(rgb) {
  if (
    !Array.isArray(rgb) ||
    rgb.length !== 3 ||
    !rgb.every((channel) => (
      Number.isFinite(channel) &&
      Number.isInteger(channel) &&
      channel >= 0 &&
      channel <= 255
    ))
  ) {
    throw new Error(`Invalid RGB color: ${rgb}`);
  }

  return `#${rgb.map((channel) => {
    return channel.toString(16).padStart(2, '0').toUpperCase();
  }).join('')}`;
}

export function normalizePaletteColor(color) {
  const rgb = color.rgb ?? hexToRgbArray(color.hex);
  const hex = color.hex ? rgbArrayToHex(hexToRgbArray(color.hex)) : rgbArrayToHex(rgb);
  if (color.hex && color.rgb && rgbArrayToHex(rgb) !== hex) {
    throw new Error(`Palette color ${color.brand}:${color.code} hex and RGB values do not match.`);
  }

  const brand = color.brand;
  const code = color.code;

  return {
    id: color.id ?? `${brand}:${code}`,
    brand,
    code,
    name: color.name ?? code,
    hex,
    rgb,
    category: color.category ?? 'solid'
  };
}

export function isNeutralRgb(rgb) {
  return Math.max(...rgb) - Math.min(...rgb) <= NEUTRAL_CHROMA_THRESHOLD;
}

export function perceptualDistance(a, b) {
  const rMean = (a[0] + b[0]) / 2;
  const r = a[0] - b[0];
  const g = a[1] - b[1];
  const blue = a[2] - b[2];
  const redWeight = 2 + rMean / 256;
  const blueWeight = 2 + (255 - rMean) / 256;
  return Math.sqrt(redWeight * r * r + 4 * g * g + blueWeight * blue * blue);
}

export function findNearestPaletteColor(rgb, palette, options = {}) {
  const disabled = options.disabledColorIds ?? new Set();
  const enabledPalette = palette.filter((color) => !disabled.has(color.id));
  const neutralCandidates = isNeutralRgb(rgb)
    ? enabledPalette.filter((color) => isNeutralRgb(color.rgb))
    : [];
  const candidates = neutralCandidates.length > 0 ? neutralCandidates : enabledPalette;

  if (candidates.length === 0) {
    throw new Error('No enabled palette colors are available for matching.');
  }

  let best = candidates[0];
  let bestDistance = perceptualDistance(rgb, best.rgb);

  for (let i = 1; i < candidates.length; i += 1) {
    const distance = perceptualDistance(rgb, candidates[i].rgb);
    if (distance < bestDistance) {
      best = candidates[i];
      bestDistance = distance;
    }
  }

  return { ...best, distance: bestDistance };
}
