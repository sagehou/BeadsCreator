export const STARTER_EMOJIS = ['😉', '😎', '😘', '🤣', '👍', '😋', '😜', '🤓', '🐻', '🐧'];
export const STARTER_PATTERN_NAMES = STARTER_EMOJIS;

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FC283C',
  yellow: '#F4D738',
  blue: '#3677D2',
  pink: '#FEB89F',
  orange: '#FEBF45',
  brown: '#8A4526',
  tan: '#F4C3A5'
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

function drawWink(grid, cx, cy) {
  drawFaceBase(grid, cx, cy, COLORS.pink);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  for (let x = 2; x <= 7; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
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

function drawKiss(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  for (let x = 2; x <= 6; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
  drawCircle(grid, cx + 5, cy + 4, 2, COLORS.red);
  setCell(grid, cx + 8, cy + 4, COLORS.red);
  setCell(grid, cx + 9, cy + 3, COLORS.red);
}

function drawLaugh(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  for (let x = -7; x <= -2; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x + 4), COLORS.black);
  for (let x = 2; x <= 7; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
  for (let y = 2; y <= 7; y += 1) {
    for (let x = -5; x <= 5; x += 1) {
      if ((x / 5) ** 2 + ((y - 3) / 4) ** 2 <= 1) setCell(grid, cx + x, cy + y, COLORS.red);
    }
  }
  for (let x = -7; x <= -5; x += 1) setCell(grid, cx + x, cy - 7, COLORS.blue);
  for (let x = 5; x <= 7; x += 1) setCell(grid, cx + x, cy - 7, COLORS.blue);
}

function drawThumbsUp(grid, cx, cy) {
  for (let y = -1; y <= 9; y += 1) {
    for (let x = -3; x <= 5; x += 1) setCell(grid, cx + x, cy + y, COLORS.orange);
  }
  for (let y = -8; y <= 1; y += 1) {
    for (let x = -7; x <= -2; x += 1) setCell(grid, cx + x, cy + y, COLORS.orange);
  }
  for (let x = -6; x <= 1; x += 1) setCell(grid, cx + x, cy - 9, COLORS.orange);
  for (let x = 6; x <= 9; x += 1) {
    for (let y = 0; y <= 2; y += 1) setCell(grid, cx + x, cy + y, COLORS.orange);
    for (let y = 4; y <= 6; y += 1) setCell(grid, cx + x, cy + y, COLORS.orange);
  }
}

function drawYum(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 3, 1, COLORS.black);
  for (let x = -5; x <= 5; x += 1) setCell(grid, cx + x, cy + 4, COLORS.red);
  for (let y = 4; y <= 9; y += 1) {
    for (let x = 1; x <= 5; x += 1) setCell(grid, cx + x, cy + y, COLORS.pink);
  }
}

function drawPlayful(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  drawCircle(grid, cx - 4, cy - 3, 1, COLORS.black);
  for (let x = 2; x <= 7; x += 1) setCell(grid, cx + x, cy - 3 + Math.abs(x - 4), COLORS.black);
  for (let x = -4; x <= 4; x += 1) setCell(grid, cx + x, cy + 4, COLORS.red);
  for (let y = 4; y <= 9; y += 1) setCell(grid, cx + 2, cy + y, COLORS.pink);
  setCell(grid, cx + 3, cy + 9, COLORS.pink);
}

function drawNerd(grid, cx, cy) {
  drawFaceBase(grid, cx, cy);
  for (const eyeX of [cx - 5, cx + 5]) {
    for (let y = -5; y <= -1; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        if (Math.abs(x) === 2 || Math.abs(y + 3) === 2) setCell(grid, eyeX + x, cy + y, COLORS.black);
      }
    }
  }
  for (let x = -3; x <= 3; x += 1) setCell(grid, cx + x, cy - 3, COLORS.black);
  drawSmileMouth(grid, cx, cy, COLORS.red);
}

function drawBear(grid, cx, cy) {
  drawCircle(grid, cx - 8, cy - 8, 4, COLORS.brown);
  drawCircle(grid, cx + 8, cy - 8, 4, COLORS.brown);
  drawCircle(grid, cx, cy, 11, COLORS.brown);
  drawCircle(grid, cx, cy + 4, 5, COLORS.tan);
  drawCircle(grid, cx - 4, cy - 2, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 2, 1, COLORS.black);
  drawCircle(grid, cx, cy + 3, 1, COLORS.black);
  for (let x = -3; x <= 3; x += 1) setCell(grid, cx + x, cy + 6 + Math.round(0.15 * x * x), COLORS.black);
}

function drawPenguin(grid, cx, cy) {
  drawCircle(grid, cx, cy, 11, COLORS.black);
  drawCircle(grid, cx, cy + 2, 8, COLORS.white);
  drawCircle(grid, cx - 4, cy - 4, 1, COLORS.black);
  drawCircle(grid, cx + 4, cy - 4, 1, COLORS.black);
  setCell(grid, cx - 1, cy, COLORS.orange);
  setCell(grid, cx, cy, COLORS.orange);
  setCell(grid, cx + 1, cy, COLORS.orange);
  for (let x = -8; x <= -5; x += 1) setCell(grid, cx + x, cy + 8, COLORS.orange);
  for (let x = 5; x <= 8; x += 1) setCell(grid, cx + x, cy + 8, COLORS.orange);
}

export function generateStarterPattern(name = randomStarterPatternName(), rows = 29, cols = 29) {
  const grid = emptyGrid(rows, cols);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const patternName = STARTER_PATTERN_NAMES.includes(name) ? name : '😉';

  if (patternName === '😉') drawWink(grid, cx, cy);
  if (patternName === '😎') drawCool(grid, cx, cy);
  if (patternName === '😘') drawKiss(grid, cx, cy);
  if (patternName === '🤣') drawLaugh(grid, cx, cy);
  if (patternName === '👍') drawThumbsUp(grid, cx, cy);
  if (patternName === '😋') drawYum(grid, cx, cy);
  if (patternName === '😜') drawPlayful(grid, cx, cy);
  if (patternName === '🤓') drawNerd(grid, cx, cy);
  if (patternName === '🐻') drawBear(grid, cx, cy);
  if (patternName === '🐧') drawPenguin(grid, cx, cy);

  return grid;
}

export function randomStarterPatternName() {
  return STARTER_PATTERN_NAMES[Math.floor(Math.random() * STARTER_PATTERN_NAMES.length)];
}
