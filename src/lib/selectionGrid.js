function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

export function normalizeSelectionRect(start, end) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.abs(start.x - end.x) + 1,
    height: Math.abs(start.y - end.y) + 1
  };
}

export function pointInRect(point, rect) {
  if (!rect) return false;
  return point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height;
}

export function extractSelection(grid, rect) {
  return Array.from({ length: rect.height }, (_, y) => (
    Array.from({ length: rect.width }, (_, x) => {
      const sourceY = rect.y + y;
      const sourceX = rect.x + x;
      return grid[sourceY]?.[sourceX] ?? null;
    })
  ));
}

export function clearSelection(grid, rect) {
  const nextGrid = cloneGrid(grid);

  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (nextGrid[y]?.[x] !== undefined) nextGrid[y][x] = null;
    }
  }

  return nextGrid;
}

export function stampSelection(grid, content, origin) {
  const nextGrid = cloneGrid(grid);

  for (let y = 0; y < content.length; y += 1) {
    for (let x = 0; x < (content[y]?.length ?? 0); x += 1) {
      const targetY = origin.y + y;
      const targetX = origin.x + x;
      if (targetY < 0 || targetX < 0 || targetY >= nextGrid.length || targetX >= (nextGrid[0]?.length ?? 0)) continue;
      nextGrid[targetY][targetX] = content[y][x];
    }
  }

  return nextGrid;
}

export function moveSelection(grid, rect, destination) {
  const content = extractSelection(grid, rect);
  const clearedGrid = clearSelection(grid, rect);
  const movedGrid = stampSelection(clearedGrid, content, destination);

  return {
    grid: movedGrid,
    rect: {
      x: destination.x,
      y: destination.y,
      width: rect.width,
      height: rect.height
    }
  };
}
