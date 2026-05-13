import { useMemo, useState } from 'react';
import { MARD_COLORS } from '../data/colors';
import { filterPaletteColors } from '../lib/paletteSearch';
import { groupPaletteByColorFamily, sortPaletteByColorFamily, sortPaletteByMardCode } from '../lib/paletteSorting';
import { hexForPaletteValue, paletteValueForColor, resolvePaletteValue } from '../lib/paletteValue';

function ColorSwatch({ color, selectedColor, selectedPaletteColor, hoveredColor, onHover, onSelectColor }) {
  const paletteValue = paletteValueForColor(color);
  const selected = selectedPaletteColor?.id === color.id || selectedColor === color.hex;

  return (
    <div
      className={`color-swatch ${selected ? 'selected' : ''}`}
      style={{ backgroundColor: color.hex }}
      title={`${color.brand} ${color.code} ${color.name}`}
      aria-label={`${color.brand} ${color.code} ${color.name}`}
      data-code={color.code}
      onClick={() => onSelectColor(paletteValue)}
      onMouseEnter={() => onHover(color)}
      onMouseLeave={() => onHover(null)}
    >
      {hoveredColor?.id === color.id && (
        <div className="color-tooltip">
          {color.brand} {color.code} {color.name}
        </div>
      )}
    </div>
  );
}

export default function ColorPalette({ selectedColor, onSelectColor, recentColors }) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('family');
  const [hoveredColor, setHoveredColor] = useState(null);

  const colors = useMemo(() => {
    const filtered = filterPaletteColors(MARD_COLORS, query);
    return sortMode === 'code'
      ? sortPaletteByMardCode(filtered)
      : sortPaletteByColorFamily(filtered);
  }, [query, sortMode]);
  const colorGroups = useMemo(() => (
    sortMode === 'family' ? groupPaletteByColorFamily(colors) : []
  ), [colors, sortMode]);
  const selectedPaletteColor = useMemo(
    () => resolvePaletteValue(selectedColor, MARD_COLORS),
    [selectedColor]
  );

  return (
    <div className="color-palette">
      <div className="palette-section-title">🎨 色板</div>

      <div className="palette-controls">
        <div className="palette-search">
          <input
            type="search"
            placeholder="搜索 MARD 色号"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="palette-sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          title="色板排序"
        >
          <option value="family">色系</option>
          <option value="code">色号</option>
        </select>
      </div>

      <div className="color-grid">
        {sortMode === 'family' ? (
          colorGroups.map((group) => (
            <div className="color-family-group" key={group.id}>
              <div className="color-family-heading">
                <span>{group.label}</span>
                <span>{group.colors.length}</span>
              </div>
              <div className="color-family-swatches">
                {group.colors.map(color => (
                  <ColorSwatch
                    key={color.id}
                    color={color}
                    selectedColor={selectedColor}
                    selectedPaletteColor={selectedPaletteColor}
                    hoveredColor={hoveredColor}
                    onHover={setHoveredColor}
                    onSelectColor={onSelectColor}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          colors.map(color => (
            <ColorSwatch
              key={color.id}
              color={color}
              selectedColor={selectedColor}
              selectedPaletteColor={selectedPaletteColor}
              hoveredColor={hoveredColor}
              onHover={setHoveredColor}
              onSelectColor={onSelectColor}
            />
          ))
        )}
      </div>

      {recentColors.length > 0 && (
        <>
          <div className="palette-section-title" style={{ marginTop: 12 }}>🕐 最近使用</div>
          <div className="recent-colors">
            {recentColors.map((value, i) => (
              <div
                key={`${value}-${i}`}
                className="recent-swatch"
                style={{ backgroundColor: hexForPaletteValue(value, MARD_COLORS) }}
                onClick={() => onSelectColor(value)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
