import { resolvePaletteValue } from './paletteValue.js';

const SYMBOLS = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function symbolForIndex(index) {
  if (index < SYMBOLS.length) return SYMBOLS[index];
  return String(index + 1);
}

function hexToRgb(hex) {
  const normalized = String(hex).trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return [255, 255, 255];
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

function textColorForHex(hex) {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#1f2937' : '#ffffff';
}

export function buildPrintLegend(grid, allColors = []) {
  const counts = new Map();

  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      const color = resolvePaletteValue(cell, allColors);
      const value = color?.id ?? cell;
      const existing = counts.get(value);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(value, {
          value,
          hex: color?.hex ?? cell,
          brand: color?.brand ?? '',
          code: color?.code ?? value,
          name: color?.name ?? value,
          count: 1
        });
      }
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((item, index) => ({ symbol: symbolForIndex(index), ...item }));
}

export function createPrintablePatternHtml({ grid, allColors = [], title = '拼豆图纸' }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const legend = buildPrintLegend(grid, allColors);
  const legendByValue = new Map(legend.map((item) => [item.value, item]));
  const colorResolver = (cell) => {
    const color = resolvePaletteValue(cell, allColors);
    return legendByValue.get(color?.id ?? cell);
  };
  const escapedTitle = escapeHtml(title);
  const generatedAt = new Date().toLocaleString('zh-CN');
  const totalBeads = legend.reduce((sum, item) => sum + item.count, 0);
  const patternColumns = `24px repeat(${cols}, minmax(0, 1fr))`;

  const columnHeaders = Array.from({ length: cols }, (_, x) => (
    `<div class="axis-cell col-axis ${((x + 1) % 5 === 0) ? 'guide-5' : ''}">${x + 1}</div>`
  )).join('');

  const patternRows = grid.map((row, y) => {
    const rowHeader = `<div class="axis-cell row-axis ${((y + 1) % 5 === 0) ? 'guide-5' : ''}">${y + 1}</div>`;
    const cells = row.map((cell, x) => {
      const item = cell ? colorResolver(cell) : null;
      const coordinate = `${x + 1},${y + 1}`;
      const guideClass = `${((x + 1) % 5 === 0) ? ' guide-5-col' : ''}${((y + 1) % 5 === 0) ? ' guide-5-row' : ''}`;
      const filledStyle = item
        ? `--bead-color:${escapeHtml(item.hex)};--cell-text:${textColorForHex(item.hex)}`
        : '';
      return `<div class="pattern-cell ${item ? 'filled' : 'empty'}${guideClass}" data-coordinate="${coordinate}" style="${filledStyle}" title="${coordinate}">
        <span class="cell-number">${item ? escapeHtml(item.symbol) : ''}</span>
      </div>`;
    }).join('');
    return `${rowHeader}${cells}`;
  }).join('');

  const legendItems = legend.map((item) => {
    const textColor = textColorForHex(item.hex);
    return `<div class="legend-item">
      <span class="legend-number" style="--bead-color:${escapeHtml(item.hex)};--cell-text:${textColor}">${escapeHtml(item.symbol)}</span>
      <span class="legend-code">${escapeHtml(`${item.brand} ${item.code}`.trim())}</span>
      <span class="legend-name">${escapeHtml(item.name)}</span>
      <span class="legend-count">×${item.count}</span>
    </div>`;
  }).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapedTitle}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f3f4f6;
      color: #1f2937;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    }
    .print-shell { min-height: 100vh; padding: 18px; }
    .print-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm;
      background: #fff;
      box-shadow: 0 16px 40px rgba(31, 41, 55, 0.16);
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #111827;
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .summary { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; color: #4b5563; font-size: 12px; }
    .summary span { padding: 3px 8px; background: #f3f4f6; border-radius: 4px; }
    .meta { color: #6b7280; font-size: 11px; line-height: 1.6; text-align: right; }
    .pattern-wrap { margin-top: 12px; }
    .pattern-grid {
      display: grid;
      grid-template-columns:${patternColumns};
      border: 2px solid #111827;
      background: #d1d5db;
      gap: 1px;
    }
    .axis-corner, .axis-cell {
      min-height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9fafb;
      color: #4b5563;
      font-size: 8px;
      font-weight: 700;
      line-height: 1;
    }
    .axis-cell.guide-5 { background: #e5e7eb; color: #111827; }
    .pattern-cell {
      position: relative;
      aspect-ratio: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      overflow: hidden;
    }
    .pattern-cell.filled { background: var(--bead-color); }
    .pattern-cell.guide-5-col { box-shadow: inset -2px 0 0 rgba(17, 24, 39, 0.32); }
    .pattern-cell.guide-5-row { box-shadow: inset 0 -2px 0 rgba(17, 24, 39, 0.32); }
    .pattern-cell.guide-5-col.guide-5-row { box-shadow: inset -2px 0 0 rgba(17, 24, 39, 0.32), inset 0 -2px 0 rgba(17, 24, 39, 0.32); }
    .cell-number {
      color: var(--cell-text, transparent);
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: clamp(6px, 1.45vw, 11px);
      font-weight: 800;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,.28), 0 1px 2px rgba(255,255,255,.3);
    }
    .legend-section { margin-top: 12px; break-inside: avoid; }
    .legend-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    .legend-head h2 { margin: 0; font-size: 14px; }
    .legend-total { color: #6b7280; font-size: 11px; }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px 10px;
      font-size: 10px;
    }
    .legend-item {
      display: grid;
      grid-template-columns: 22px minmax(42px, auto) minmax(0, 1fr) auto;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      border-bottom: 1px dotted #d1d5db;
      min-width: 0;
    }
    .legend-number {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      border: 1px solid rgba(0,0,0,.15);
      background: var(--bead-color);
      color: var(--cell-text);
      font-weight: 800;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    }
    .legend-code { font-weight: 800; white-space: nowrap; }
    .legend-name { color: #4b5563; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .legend-count { font-weight: 800; text-align: right; }
    .print-tip { margin-top: 8px; color: #6b7280; font-size: 11px; }
    .print-actions { margin-top: 14px; text-align: center; }
    .print-button {
      border: 0;
      border-radius: 6px;
      background: #111827;
      color: white;
      padding: 9px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      html, body { background: white !important; }
      .print-shell { padding: 0; }
      .print-sheet { width: auto; min-height: auto; padding: 0; box-shadow: none; }
      .pattern-grid { page-break-inside: avoid; }
      .legend-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); font-size: 9px; gap: 2px 8px; }
      .print-actions { display: none !important; }
    }
  </style>
</head>
<body>
  <main class="print-shell">
    <section class="print-sheet">
      <header class="sheet-header">
        <div>
          <h1>${escapedTitle}</h1>
          <div class="summary">
            <span>尺寸：${cols} × ${rows}</span>
            <span>总数：${totalBeads} 颗</span>
            <span>共 ${legend.length} 色 · ${totalBeads} 颗</span>
          </div>
        </div>
        <div class="meta">生成：${escapeHtml(generatedAt)}<br />每格数字对应下方色号</div>
      </header>

      <section class="pattern-wrap">
        <div class="pattern-grid" aria-label="拼豆坐标图纸" style="grid-template-columns:${patternColumns}">
          <div class="axis-corner"></div>${columnHeaders}${patternRows}
        </div>
      </section>

      <section class="legend-section">
        <div class="legend-head">
          <h2>色号清单</h2>
          <div class="legend-total">共 ${legend.length} 色 · ${totalBeads} 颗</div>
        </div>
        <div class="legend-grid">${legendItems || '<div class="legend-item">画布为空</div>'}</div>
        <div class="print-tip">每格内数字对应色号清单；上方和左侧为行列坐标，粗线为每 5 格辅助线。</div>
      </section>

      <div class="print-actions">
        <button class="print-button" type="button" onclick="window.print()">打印 / 另存为 PDF</button>
      </div>
    </section>
  </main>
</body>
</html>`;
}
