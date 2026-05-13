import { useMemo, useState } from 'react';
import { MARD_COLORS } from '../data/colors';
import { filterPaletteColors } from '../lib/paletteSearch';

export default function ColorPalette({ selectedColor, onSelectColor, recentColors }) {
  const [query, setQuery] = useState('');
  const [hoveredColor, setHoveredColor] = useState(null);

  const colors = useMemo(() => filterPaletteColors(MARD_COLORS, query), [query]);

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
        {colors.map(color => (
          <div
            key={color.id}
            className={`color-swatch ${selectedColor === color.hex ? 'selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            onClick={() => onSelectColor(color.hex)}
            onMouseEnter={() => setHoveredColor(color)}
            onMouseLeave={() => setHoveredColor(null)}
          >
            {hoveredColor?.id === color.id && (
              <div className="color-tooltip">
                {color.brand} {color.code} {color.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {recentColors.length > 0 && (
        <>
          <div className="palette-section-title" style={{ marginTop: 12 }}>🕐 最近使用</div>
          <div className="recent-colors">
            {recentColors.map((hex, i) => (
              <div
                key={`${hex}-${i}`}
                className="recent-swatch"
                style={{ backgroundColor: hex }}
                onClick={() => onSelectColor(hex)}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
