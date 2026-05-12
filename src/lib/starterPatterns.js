export const STARTER_PATTERN_NAMES = ['heart', 'star', 'flower', 'cat', 'rainbow', 'smile'];

const COLORS = {
  black: '#232426',
  white: '#F5F4EE',
  red: '#F22D41',
  yellow: '#FAD52D',
  blue: '#247AD8',
  green: '#34A85C',
  pink: '#F6B2A4',
  brown: '#7B4A2D'
};

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function setCell(grid, x, y, color) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) grid[y][x] = color;
}

function drawCircle(grid, cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) setCell(grid, x, y, color);
    }
  }
}

function drawHeart(grid, cx, cy) {
  drawCircle(grid, cx - 4, cy - 4, 5, COLORS.red);
  drawCircle(grid, cx + 4, cy - 4, 5, COLORS.red);
  for (let y = cy - 3; y <= cy + 9; y += 1) {
    const halfWidth = Math.max(0, 10 - Math.abs(y - cy + 1));
    for (let x = cx - halfWidth; x <= cx + halfWidth; x += 1) setCell(grid, x, y, COLORS.red);
  }
}

function drawStar(grid, cx, cy) {
  for (let i = -10; i <= 10; i += 1) {
    setCell(grid, cx + i, cy, COLORS.yellow);
    setCell(grid, cx, cy + i, COLORS.yellow);
    if (Math.abs(i) <= 7) {
      setCell(grid, cx + i, cy + i, COLORS.yellow);
      setCell(grid, cx + i, cy - i, COLORS.yellow);
    }
  }
}

function drawFlower(grid, cx, cy) {
  drawCircle(grid, cx - 6, cy, 4, COLORS.pink);
  drawCircle(grid, cx + 6, cy, 4, COLORS.pink);
  drawCircle(grid, cx, cy - 6, 4, COLORS.pink);
  drawCircle(grid, cx, cy + 6, 4, COLORS.pink);
  drawCircle(grid, cx, cy, 4, COLORS.yellow);
  for (let y = cy + 5; y <= cy + 12; y += 1) setCell(grid, cx, y, COLORS.green);
}

function drawCat(grid, cx, cy) {
  drawCircle(grid, cx, cy, 10, COLORS.yellow);
  for (let i = 0; i < 7; i += 1) {
    setCell(grid, cx - 9 + i, cy - 9 - i, COLORS.yellow);
    setCell(grid, cx + 9 - i, cy - 9 - i, COLORS.yellow);
  }
  drawCircle(grid, cx - 4, cy - 2, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 2, 1, COLORS.black);
  setCell(grid, cx, cy + 2, COLORS.pink);
  for (let i = -3; i <= 3; i += 1) setCell(grid, cx + i, cy + 6 + Math.abs(i % 2), COLORS.black);
}

function drawRainbow(grid, cx, cy) {
  const bands = [COLORS.red, COLORS.yellow, COLORS.green, COLORS.blue];
  for (let b = 0; b < bands.length; b += 1) {
    const radius = 12 - b * 2;
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      const yOffset = Math.round(Math.sqrt(Math.max(0, radius ** 2 - (x - cx) ** 2)));
      setCell(grid, x, cy - yOffset, bands[b]);
      setCell(grid, x, cy - yOffset + 1, bands[b]);
    }
  }
}

function drawSmile(grid, cx, cy) {
  drawCircle(grid, cx, cy, 11, COLORS.yellow);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 3, 1, COLORS.black);
  for (let x = -5; x <= 5; x += 1) {
    const y = cy + 4 + Math.round(0.12 * x * x);
    setCell(grid, cx + x, y, COLORS.red);
  }
}

export function generateStarterPattern(name = randomStarterPatternName(), rows = 29, cols = 29) {
  const grid = emptyGrid(rows, cols);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const patternName = STARTER_PATTERN_NAMES.includes(name) ? name : 'heart';

  if (patternName === 'heart') drawHeart(grid, cx, cy);
  if (patternName === 'star') drawStar(grid, cx, cy);
  if (patternName === 'flower') drawFlower(grid, cx, cy);
  if (patternName === 'cat') drawCat(grid, cx, cy);
  if (patternName === 'rainbow') drawRainbow(grid, cx, cy + 7);
  if (patternName === 'smile') drawSmile(grid, cx, cy);

  return grid;
}

export function randomStarterPatternName() {
  return STARTER_PATTERN_NAMES[Math.floor(Math.random() * STARTER_PATTERN_NAMES.length)];
}
