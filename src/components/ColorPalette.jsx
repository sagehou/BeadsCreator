import { useMemo, useState } from 'react';
import { MARD_COLORS } from '../data/colors';
import { filterPaletteColors } from '../lib/paletteSearch';
import { sortPaletteByColorFamily } from '../lib/paletteSorting';
import { hexForPaletteValue, paletteValueForColor, resolvePaletteValue } from '../lib/paletteValue';

export default function ColorPalette({ selectedColor, onSelectColor, recentColors }) {
  const [query, setQuery] = useState('');
  const [hoveredColor, setHoveredColor] = useState(null);

  const colors = useMemo(
    () => sortPaletteByColorFamily(filterPaletteColors(MARD_COLORS, query)),
    [query]
  );
  const selectedPaletteColor = useMemo(
    () => resolvePaletteValue(selectedColor, MARD_COLORS),
    [selectedColor]
  );

  return (
    <>
      <div className="palette-section-title">🎨 色板</div>

      <div className="palette-search">
        <input
          type="search"
          placeholder="搜索 MARD 色号"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="color-grid">
        {colors.map(color => {
          const paletteValue = paletteValueForColor(color);
          const selected = selectedPaletteColor?.id === color.id || selectedColor === color.hex;

          return (
            <div
              key={color.id}
              className={`color-swatch ${selected ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => onSelectColor(paletteValue)}
              onMouseEnter={() => setHoveredColor(color)}
              onMouseLeave={() => setHoveredColor(null)}
            >
              {hoveredColor?.id === color.id && (
                <div className="color-tooltip">
                  {color.brand} {color.code} {color.name}
                </div>
              )}
            </div>
          );
        })}
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
    </>
  );
}
