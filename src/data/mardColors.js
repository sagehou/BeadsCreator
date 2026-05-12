import { normalizePaletteColor } from '../lib/colorUtils.js';

// Source: https://www.pixel-beads.com/zh/mard-bead-color-chart
// Expand this list from the source page during Task 12 when the UI is wired.
const MARD_COLOR_ROWS = [
  { code: 'M-K01', name: 'Black', hex: '#232426' },
  { code: 'M-W01', name: 'White', hex: '#F5F4EE' },
  { code: 'M-R01', name: 'Red', hex: '#F22D41' },
  { code: 'M-Y01', name: 'Yellow', hex: '#FAD52D' },
  { code: 'M-B01', name: 'Blue', hex: '#247AD8' },
  { code: 'M-G01', name: 'Green', hex: '#34A85C' },
  { code: 'M-P01', name: 'Skin Pink', hex: '#F6B2A4' },
  { code: 'M-BR01', name: 'Brown', hex: '#7B4A2D' }
];

export const MARD_COLORS = MARD_COLOR_ROWS.map((color) => normalizePaletteColor({
  ...color,
  brand: 'MARD'
}));

export const PALETTE_BRANDS = {
  MARD: {
    label: 'MARD',
    colors: MARD_COLORS
  }
};

export function getPaletteByBrand(brand = 'MARD') {
  return PALETTE_BRANDS[brand]?.colors ?? MARD_COLORS;
}
