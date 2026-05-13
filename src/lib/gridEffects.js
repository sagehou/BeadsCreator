import { hexToRgbArray } from './colorUtils.js';

const OUTLINE_DIRECTIONS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1]
];

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function luminance(rgb) {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function resolveOutlineColor(grid, options) {
  if (options.mode === 'black') return '#000000';
  if (options.mode === 'white') return '#FFFFFF';
  if (options.mode === 'custom') return options.color || '#000000';
  return chooseAutoOutlineColor(grid);
}

export function chooseAutoOutlineColor(grid) {
  const filled = [];

  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      try {
        filled.push(hexToRgbArray(cell));
      } catch {
        // Ignore palette values that are not raw hex colors.
      }
    }
  }

  if (filled.length === 0) return '#000000';

  const averageLuminance = filled.reduce((total, rgb) => total + luminance(rgb), 0) / filled.length;
  return averageLuminance < 128 ? '#FFFFFF' : '#000000';
}

export function applyOutlineToGrid(grid, options = {}) {
  const mode = options.mode ?? 'none';
  const width = Math.max(0, Math.floor(Number(options.width ?? 1)));
  if (mode === 'none' || width <= 0) return grid;

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const outlineColor = resolveOutlineColor(grid, { ...options, mode });
  const nextGrid = cloneGrid(grid);
  let frontier = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (grid[y][x]) frontier.push({ x, y });
    }
  }

  for (let step = 0; step < width; step += 1) {
    const nextFrontier = [];
    const seen = new Set();

    for (const cell of frontier) {
      for (const [dx, dy] of OUTLINE_DIRECTIONS) {
        const nx = cell.x + dx;
        const ny = cell.y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (nextGrid[ny][nx]) continue;

        const key = `${nx},${ny}`;
        if (seen.has(key)) continue;
        seen.add(key);
        nextGrid[ny][nx] = outlineColor;
        nextFrontier.push({ x: nx, y: ny });
      }
    }

    frontier = nextFrontier;
    if (frontier.length === 0) break;
  }

  return nextGrid;
}
