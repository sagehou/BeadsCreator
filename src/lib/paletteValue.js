export function paletteValueForColor(color) {
  return color?.id ?? color?.hex ?? null;
}

export function resolvePaletteValue(value, palette = []) {
  if (!value) return null;

  const idMatch = palette.find((color) => color.id === value);
  if (idMatch) return idMatch;

  const normalizedValue = typeof value === 'string' ? value.toUpperCase() : value;
  return palette.find((color) => color.hex.toUpperCase() === normalizedValue) ?? null;
}

export function hexForPaletteValue(value, palette = []) {
  return resolvePaletteValue(value, palette)?.hex ?? value;
}
