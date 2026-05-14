import { perceptualDistance } from './colorUtils.js';

function paletteLookup(palette) {
  return new Map(palette.map((color) => [color.hex.toUpperCase(), color]));
}

function countGridColors(grid) {
  const counts = new Map();
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      const key = cell.toUpperCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function nearestKeptColor(color, keptColors) {
  let best = keptColors[0];
  let bestDistance = perceptualDistance(color.rgb, best.rgb);

  for (let i = 1; i < keptColors.length; i += 1) {
    const distance = perceptualDistance(color.rgb, keptColors[i].rgb);
    if (distance < bestDistance) {
      best = keptColors[i];
      bestDistance = distance;
    }
  }

  return best;
}

function chooseDiverseKeptHexes(counts, byHex, limit) {
  const candidates = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count, color: byHex.get(hex) }))
    .filter((candidate) => candidate.color)
    .sort((a, b) => b.count - a.count || a.hex.localeCompare(b.hex));

  if (candidates.length <= limit) return candidates.map((candidate) => candidate.hex);

  const kept = [candidates[0]];
  const remaining = candidates.slice(1);

  while (kept.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -1;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const nearestDistance = Math.min(
        ...kept.map((keptCandidate) => perceptualDistance(candidate.color.rgb, keptCandidate.color.rgb))
      );
      const score = candidate.count * Math.max(1, nearestDistance);
      if (
        score > bestScore + 20 ||
        (score === bestScore && candidate.count > remaining[bestIndex].count) ||
        (Math.abs(score - bestScore) <= 20 && candidate.count === remaining[bestIndex].count && candidate.hex.localeCompare(remaining[bestIndex].hex) < 0)
      ) {
        bestIndex = i;
        bestScore = score;
      }
    }

    kept.push(remaining.splice(bestIndex, 1)[0]);
  }

  return kept.map((candidate) => candidate.hex);
}

export function limitGridToTopColors(grid, palette, colorLimit) {
  const limit = Math.max(0, Math.floor(Number(colorLimit) || 0));
  if (limit <= 0) return grid;

  const counts = countGridColors(grid);
  if (counts.size <= limit) return grid;

  const byHex = paletteLookup(palette);
  const keptHexes = chooseDiverseKeptHexes(counts, byHex, limit);
  const keptSet = new Set(keptHexes);
  const keptColors = keptHexes.map((hex) => byHex.get(hex)).filter(Boolean);
  if (keptColors.length === 0) return grid;

  const remap = new Map();
  for (const hex of counts.keys()) {
    if (keptSet.has(hex)) {
      remap.set(hex, byHex.get(hex)?.hex ?? hex);
      continue;
    }

    const color = byHex.get(hex);
    remap.set(hex, color ? nearestKeptColor(color, keptColors).hex : keptColors[0].hex);
  }

  return grid.map((row) => row.map((cell) => (cell ? remap.get(cell.toUpperCase()) : cell)));
}
