import { hexToRgbArray, perceptualDistance } from './colorUtils.js';

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function cellKey(x, y) {
  return `${x},${y}`;
}

export function findConnectedRegions(grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = new Set();
  const regions = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const color = grid[y][x];
      const startKey = cellKey(x, y);
      if (!color || visited.has(startKey)) continue;

      const queue = [[x, y]];
      const cells = [];
      visited.add(startKey);

      for (let head = 0; head < queue.length; head += 1) {
        const [cx, cy] = queue[head];
        cells.push({ x: cx, y: cy });

        for (const [dx, dy] of DIRECTIONS) {
          const nx = cx + dx;
          const ny = cy + dy;
          const key = cellKey(nx, ny);
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || visited.has(key)) continue;
          if (grid[ny][nx] !== color) continue;
          visited.add(key);
          queue.push([nx, ny]);
        }
      }

      regions.push({ id: regions.length, color, cells });
    }
  }

  return regions;
}

function paletteByHex(palette) {
  return new Map(palette.map((color) => [color.hex.toUpperCase(), color]));
}

function rgbForHex(hex, paletteMap) {
  const paletteColor = paletteMap.get(hex.toUpperCase());
  if (paletteColor) return paletteColor.rgb;

  try {
    return hexToRgbArray(hex);
  } catch {
    return null;
  }
}

function buildRegionLookup(regions) {
  const lookup = new Map();
  for (const region of regions) {
    for (const cell of region.cells) lookup.set(cellKey(cell.x, cell.y), region);
  }
  return lookup;
}

function adjacentRegionsForRegion(region, lookup, grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const candidates = new Map();

  for (const cell of region.cells) {
    for (const [dx, dy] of DIRECTIONS) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const neighbor = lookup.get(cellKey(nx, ny));
      if (!neighbor || neighbor.id === region.id) continue;
      candidates.set(neighbor.id, neighbor);
    }
  }

  return [...candidates.values()];
}

function bestNeighborForRegion(region, lookup, grid, paletteMap, minRegionSize) {
  const sourceRgb = rgbForHex(region.color, paletteMap);
  const candidateRegions = adjacentRegionsForRegion(region, lookup, grid);
  const stableCandidates = candidateRegions.filter((candidate) => candidate.cells.length >= minRegionSize);
  const eligibleCandidates = stableCandidates.length > 0 ? stableCandidates : candidateRegions;

  let best = null;
  for (const candidate of eligibleCandidates) {
    const targetRgb = rgbForHex(candidate.color, paletteMap);
    const distance = sourceRgb && targetRgb
      ? perceptualDistance(sourceRgb, targetRgb)
      : Number.POSITIVE_INFINITY;
    const score = { candidate, distance };
    if (
      !best ||
      score.distance < best.distance ||
      (score.distance === best.distance && candidate.cells.length > best.candidate.cells.length)
    ) {
      best = score;
    }
  }

  return best?.candidate ?? null;
}

function distanceBetweenRegions(region, candidate, paletteMap) {
  const sourceRgb = rgbForHex(region.color, paletteMap);
  const targetRgb = rgbForHex(candidate.color, paletteMap);
  return sourceRgb && targetRgb
    ? perceptualDistance(sourceRgb, targetRgb)
    : Number.POSITIVE_INFINITY;
}

function chooseMergeDirection(region, candidate) {
  if (region.cells.length > candidate.cells.length) {
    return { source: candidate, target: region };
  }

  if (candidate.cells.length > region.cells.length) {
    return { source: region, target: candidate };
  }

  return region.id < candidate.id
    ? { source: candidate, target: region }
    : { source: region, target: candidate };
}

function bestSimilarMerge(regions, lookup, grid, paletteMap, similarityThreshold) {
  let best = null;

  for (const region of regions) {
    for (const candidate of adjacentRegionsForRegion(region, lookup, grid)) {
      if (candidate.id <= region.id || candidate.color === region.color) continue;
      const distance = distanceBetweenRegions(region, candidate, paletteMap);
      if (distance > similarityThreshold) continue;

      const merge = chooseMergeDirection(region, candidate);
      const score = {
        ...merge,
        distance
      };

      if (
        !best ||
        score.distance < best.distance ||
        (score.distance === best.distance && score.source.cells.length < best.source.cells.length) ||
        (score.distance === best.distance && score.source.cells.length === best.source.cells.length && score.source.id > best.source.id)
      ) {
        best = score;
      }
    }
  }

  return best;
}

export function cleanupSpeckles(grid, palette, options = {}) {
  const minRegionSize = Math.max(0, Number(options.minRegionSize ?? 0));
  const similarityThreshold = Math.max(0, Number(options.similarityThreshold ?? 0));
  if (minRegionSize <= 0 && similarityThreshold <= 0) return grid;

  const nextGrid = cloneGrid(grid);
  const paletteMap = paletteByHex(palette);
  const maxPasses = nextGrid.length * (nextGrid[0]?.length ?? 0);

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const regions = findConnectedRegions(nextGrid);
    const lookup = buildRegionLookup(regions);

    const smallRegion = minRegionSize > 0
      ? regions.find((candidate) => candidate.cells.length < minRegionSize)
      : null;

    if (smallRegion) {
      const neighbor = bestNeighborForRegion(smallRegion, lookup, nextGrid, paletteMap, minRegionSize);
      if (!neighbor) break;
      for (const cell of smallRegion.cells) nextGrid[cell.y][cell.x] = neighbor.color;
      continue;
    }

    const similarMerge = similarityThreshold > 0
      ? bestSimilarMerge(regions, lookup, nextGrid, paletteMap, similarityThreshold)
      : null;
    if (!similarMerge) break;
    for (const cell of similarMerge.source.cells) nextGrid[cell.y][cell.x] = similarMerge.target.color;
  }

  return nextGrid;
}
