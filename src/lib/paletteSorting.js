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

function isNeutral({ saturation, lightness }) {
  return saturation < 0.18 || lightness < 0.14 || lightness > 0.96;
}

function isBrown({ hue, saturation, lightness }) {
  return hue >= 8 && hue < 55 && saturation > 0.15 && saturation < 0.85 && lightness < 0.55;
}

function familyOrder(hsl) {
  if (isNeutral(hsl)) return 9;
  if (isBrown(hsl)) return 8;
  if (hsl.hue < 15 || hsl.hue >= 345) return 0;
  if (hsl.hue < 45) return 1;
  if (hsl.hue < 75) return 2;
  if (hsl.hue < 165) return 3;
  if (hsl.hue < 205) return 4;
  if (hsl.hue < 255) return 5;
  if (hsl.hue < 300) return 6;
  return 7;
}

const COLOR_FAMILIES = [
  { id: 'red', label: '红' },
  { id: 'orange', label: '橙' },
  { id: 'yellow', label: '黄' },
  { id: 'green', label: '绿' },
  { id: 'cyan', label: '青' },
  { id: 'blue', label: '蓝' },
  { id: 'purple', label: '紫' },
  { id: 'pink', label: '粉' },
  { id: 'brown', label: '棕' },
  { id: 'neutral', label: '黑白灰' }
];

function huePosition(hue, family) {
  if (family === 0 && hue >= 345) return hue - 360;
  return hue;
}

function sortKey(color) {
  const hsl = rgbToHsl(rgbFromColor(color));
  const family = familyOrder(hsl);
  return {
    family,
    hue: huePosition(hsl.hue, family),
    lightness: hsl.lightness,
    saturation: hsl.saturation,
    code: color.code ?? ''
  };
}

export function sortPaletteByColorFamily(colors) {
  return [...colors].sort((a, b) => {
    const keyA = sortKey(a);
    const keyB = sortKey(b);

    const neutralSort = keyA.family === 9 && keyB.family === 9
      ? keyB.lightness - keyA.lightness
      : 0;

    return keyA.family - keyB.family ||
      neutralSort ||
      keyB.lightness - keyA.lightness ||
      keyA.hue - keyB.hue ||
      keyB.saturation - keyA.saturation ||
      keyA.code.localeCompare(keyB.code, undefined, { numeric: true });
  });
}

export function sortPaletteByMardCode(colors) {
  return [...colors].sort((a, b) => (
    (a.code ?? '').localeCompare(b.code ?? '', undefined, {
      numeric: true,
      sensitivity: 'base'
    }) ||
    (a.hex ?? '').localeCompare(b.hex ?? '')
  ));
}

export function groupPaletteByColorFamily(colors) {
  const groups = new Map(COLOR_FAMILIES.map((family) => [
    family.id,
    { ...family, colors: [] }
  ]));

  for (const color of sortPaletteByColorFamily(colors)) {
    const family = COLOR_FAMILIES[sortKey(color).family] ?? COLOR_FAMILIES[COLOR_FAMILIES.length - 1];
    groups.get(family.id).colors.push(color);
  }

  return [...groups.values()].filter((group) => group.colors.length > 0);
}
