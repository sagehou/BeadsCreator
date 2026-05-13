function rgbFromColor(color) {
  if (Array.isArray(color.rgb)) return color.rgb;

  const hex = color.hex?.replace('#', '');
  if (!hex || hex.length !== 6) return [0, 0, 0];

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ];
}

function rgbToHsl([r, g, b]) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { hue: 0, saturation: 0, lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  return {
    hue: (hue * 60 + 360) % 360,
    saturation,
    lightness
  };
}

function familyOrder({ hue, saturation, lightness }) {
  if (saturation < 0.12 || lightness < 0.08 || lightness > 0.94) return 9;
  if (hue < 18 || hue >= 345) return 0;
  if (hue < 45) return 1;
  if (hue < 75) return 2;
  if (hue < 165) return 3;
  if (hue < 205) return 4;
  if (hue < 255) return 5;
  if (hue < 292) return 6;
  return 7;
}

function sortKey(color) {
  const hsl = rgbToHsl(rgbFromColor(color));
  return {
    family: familyOrder(hsl),
    hue: hsl.hue,
    lightness: hsl.lightness,
    code: color.code ?? ''
  };
}

export function sortPaletteByColorFamily(colors) {
  return [...colors].sort((a, b) => {
    const keyA = sortKey(a);
    const keyB = sortKey(b);

    return keyA.family - keyB.family ||
      keyA.hue - keyB.hue ||
      keyA.lightness - keyB.lightness ||
      keyA.code.localeCompare(keyB.code, undefined, { numeric: true });
  });
}
