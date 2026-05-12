import { useMemo } from 'react';
import { countBeads, } from '../hooks/useBeadBoard';
import { getAllColors } from '../data/colors';

export default function BomPanel({ grid, exportScale, onExportScaleChange, onExportPng, onExportCsv }) {
  const allColors = useMemo(() => getAllColors(), []);
  const beadCounts = useMemo(() => countBeads(grid, allColors), [grid, allColors]);
  const totalBeads = beadCounts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bom-panel">
      <div className="bom-title">
        <span>📋 物料清单</span>
        <span style={{ fontSize: '0.75rem', color: '#A1887F' }}>{beadCounts.length} 色</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="bom-table">
          <thead>
            <tr>
              <th>颜色</th>
              <th>品牌</th>
              <th>色号</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            {beadCounts.map(item => (
              <tr key={item.hex}>
                <td>
                  <span className="bom-color-dot" style={{ backgroundColor: item.hex }} />
                </td>
                <td>{item.info?.brand || '-'}</td>
                <td>{item.info?.code || '-'}</td>
                <td style={{ fontWeight: 600 }}>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bom-total">
        总计: {totalBeads} 颗拼豆
      </div>

      {/* Export PNG */}
      <div className="palette-section-title" style={{ marginTop: 12 }}>📸 导出图片</div>
      <div className="export-scale">
        {[1, 2, 3, 4].map(s => (
          <button
            key={s}
            className={`scale-btn ${exportScale === s ? 'active' : ''}`}
            onClick={() => onExportScaleChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
      <button className="bom-export-btn" onClick={onExportPng}>
        💾 导出 PNG
      </button>

      {/* Export CSV */}
      <button className="bom-export-btn" style={{ marginTop: 6 }} onClick={onExportCsv}>
        📊 导出物料 CSV
      </button>
    </div>
  );
}
