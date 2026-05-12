import { useState } from 'react';
import { PERLER_COLORS, HAMA_COLORS } from '../data/colors';

export default function ColorPalette({ selectedColor, onSelectColor, recentColors }) {
  const [activeBrand, setActiveBrand] = useState('Perler');
  const [hoveredColor, setHoveredColor] = useState(null);

  const colors = activeBrand === 'Perler' ? PERLER_COLORS : HAMA_COLORS;

  return (
    <>
      <div className="palette-section-title">🎨 色板</div>

      <div className="palette-tabs">
        <button
          className={`palette-tab ${activeBrand === 'Perler' ? 'active' : ''}`}
          onClick={() => setActiveBrand('Perler')}
        >
          Perler
        </button>
        <button
          className={`palette-tab ${activeBrand === 'Hama' ? 'active' : ''}`}
          onClick={() => setActiveBrand('Hama')}
        >
          Hama
        </button>
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
                {color.brand} #{color.code} {color.name}
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
