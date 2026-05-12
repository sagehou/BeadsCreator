import {
  MARD_COLORS,
  PALETTE_BRANDS,
  getPaletteByBrand
} from './mardColors.js';
import {
  findNearestPaletteColor,
  hexToRgbArray
} from '../lib/colorUtils.js';
import { generateStarterPattern } from '../lib/starterPatterns.js';

export { MARD_COLORS };

export const PERLER_COLORS = MARD_COLORS;
export const HAMA_COLORS = MARD_COLORS;

export function getAllColors(brand = 'MARD') {
  return getPaletteByBrand(brand);
}

export function getPaletteBrands() {
  return PALETTE_BRANDS;
}

export function findClosestColor(r, g, b, palette = MARD_COLORS) {
  return findNearestPaletteColor([r, g, b], palette);
}

export function hexToRgb(hex) {
  const [r, g, b] = hexToRgbArray(hex);
  return { r, g, b };
}

export function generateRandomStarterPattern(rows = 29, cols = 29) {
  return generateStarterPattern(undefined, rows, cols);
}

export function generateSmileyPattern() {
  return generateRandomStarterPattern(29, 29);
}
