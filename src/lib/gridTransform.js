export function mirrorGridHorizontal(grid) {
  return grid.map((row) => [...row].reverse());
}
