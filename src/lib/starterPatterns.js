export const STARTER_PATTERN_NAMES = ['happy', 'wink', 'heart-eyes', 'cool', 'sleepy', 'blush'];

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FC283C',
  yellow: '#F4D738',
  blue: '#3677D2',
  pink: '#FEB89F'
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

function drawFaceBase(grid, cx, cy, color = COLORS.yellow) {
  drawCircle(grid, cx, cy, 11, color);
}

function drawSmileMouth(grid, cx, cy, color = COLORS.red) {
  for (let x = -5; x <= 5; x += 1) {
    const y = cy + 4 + Math.round(0.12 * x * x);
    setCell(grid, cx + x, y, color);
  }
}

function drawHappy(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx - 7, cy + 2, 2, COLORS.pink);
  drawCircle(grid, cx + 7, cy + 2, 2, COLORS.pink);
  drawSmileMouth(grid, cx, cy);
}

function drawWink(grid, cx, cy) {
  drawFaceBase(grid, cx, cy, COLORS.pink);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  for (let x = 2; x <= 7; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
  drawSmileMouth(grid, cx, cy, COLORS.red);
}

function drawHeartEyes(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  for (const eyeX of [cx - 5, cx + 5]) {
    drawCircle(grid, eyeX - 1, cy - 4, 2, COLORS.red);
    drawCircle(grid, eyeX + 1, cy - 4, 2, COLORS.red);
    setCell(grid, eyeX, cy - 1, COLORS.red);
  }
  drawSmileMouth(grid, cx, cy, COLORS.red);
}

function drawCool(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  for (let x = -8; x <= 8; x += 1) setCell(grid, cx + x, cy - 4, COLORS.black);
  for (let y = -5; y <= -2; y += 1) {
    for (let x = -8; x <= -2; x += 1) setCell(grid, cx + x, cy + y, COLORS.black);
    for (let x = 2; x <= 8; x += 1) setCell(grid, cx + x, cy + y, COLORS.black);
  }
  for (let x = -4; x <= 4; x += 1) setCell(grid, cx + x, cy + 5, COLORS.red);
}

function drawSleepy(grid, cx, cy) {
  drawFaceBase(grid, cx, cy, COLORS.blue);
  for (let x = -7; x <= -2; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x + 4), COLORS.black);
  for (let x = 2; x <= 7; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
  for (let x = -3; x <= 3; x += 1) setCell(grid, cx + x, cy + 5, COLORS.black);
  for (let i = 0; i < 4; i += 1) {
    setCell(grid, cx + 8 + i, cy - 12, COLORS.white);
    setCell(grid, cx + 11 - i, cy - 9, COLORS.white);
  }
}

function drawBlush(grid, cx, cy) {
  drawFaceBase(grid, cx, cy, COLORS.pink);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx - 7, cy + 2, 2, COLORS.red);
  drawCircle(grid, cx + 7, cy + 2, 2, COLORS.red);
  for (let x = -3; x <= 3; x += 1) setCell(grid, cx + x, cy + 5, COLORS.red);
}

export function generateStarterPattern(name = randomStarterPatternName(), rows = 29, cols = 29) {
  const grid = emptyGrid(rows, cols);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const patternName = STARTER_PATTERN_NAMES.includes(name) ? name : 'happy';

  if (patternName === 'happy') drawHappy(grid, cx, cy);
  if (patternName === 'wink') drawWink(grid, cx, cy);
  if (patternName === 'heart-eyes') drawHeartEyes(grid, cx, cy);
  if (patternName === 'cool') drawCool(grid, cx, cy);
  if (patternName === 'sleepy') drawSleepy(grid, cx, cy);
  if (patternName === 'blush') drawBlush(grid, cx, cy);

  return grid;
}

export function randomStarterPatternName() {
  return STARTER_PATTERN_NAMES[Math.floor(Math.random() * STARTER_PATTERN_NAMES.length)];
}
