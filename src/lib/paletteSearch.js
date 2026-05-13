export function filterPaletteColors(colors, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return colors;

  return colors.filter((color) => (
    color.code.toLowerCase().includes(normalizedQuery) ||
    color.name.toLowerCase().includes(normalizedQuery) ||
    color.hex.toLowerCase().includes(normalizedQuery)
  ));
}
