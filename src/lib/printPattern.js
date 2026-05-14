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

  const gridRows = grid.map((row, y) => `
      <tr>
        <th class="row-axis ${((y + 1) % 5 === 0) ? 'guide-5' : ''}">${y + 1}</th>
        ${row.map((cell, x) => {
    const item = cell ? colorResolver(cell) : null;
    const coordinate = `${x + 1},${y + 1}`;
    const guideClass = `${((x + 1) % 5 === 0) ? ' guide-5-col' : ''}${((y + 1) % 5 === 0) ? ' guide-5-row' : ''}`;
    return `<td class="${item ? 'filled' : 'empty'}${guideClass}" data-coordinate="${coordinate}" style="${item ? `--bead-color:${escapeHtml(item.hex)}` : ''}">
          <span class="cell-symbol">${item ? escapeHtml(item.symbol) : ''}</span>
          <span class="cell-coordinate">${coordinate}</span>
        </td>`;
  }).join('')}
      </tr>`).join('');

  const legendRows = legend.map((item) => `
          <tr>
            <td class="legend-symbol">${escapeHtml(item.symbol)}</td>
            <td><span class="legend-dot" style="--bead-color:${escapeHtml(item.hex)}"></span></td>
            <td>${escapeHtml(item.brand)}</td>
            <td>${escapeHtml(item.code)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${item.count}</td>
          </tr>`).join('');

  const colHeaders = Array.from({ length: cols }, (_, index) => `<th class="${((index + 1) % 5 === 0) ? 'guide-5' : ''}">${index + 1}</th>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapedTitle}</title>
  <style>
    @page { margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #2d2421; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 12px; border-bottom: 2px solid #ded6cc; padding-bottom: 8px; }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .meta { font-size: 12px; color: #6f625b; text-align: right; line-height: 1.55; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 14px; align-items: start; }
    table { border-collapse: collapse; }
    .pattern { width: 100%; table-layout: fixed; }
    .pattern th { height: 18px; background: #f5efe7; color: #6f625b; font-size: 7px; font-weight: 600; border: 1px solid #d6cec4; }
    .pattern td { position: relative; aspect-ratio: 1; min-width: 14px; border: 1px solid #cfc7bd; background: #fff; text-align: center; overflow: hidden; }
    .pattern th.guide-5 { background: #ece2d6; color: #3f342e; }
    .pattern td.guide-5-col { border-right-color: #8f8276; border-right-width: 2px; }
    .pattern td.guide-5-row { border-bottom-color: #8f8276; border-bottom-width: 2px; }
    .pattern td.filled { background: var(--bead-color); }
    .row-axis { width: 22px; }
    .cell-symbol { position: absolute; inset: 2px 2px auto; font-size: 8px; line-height: 1; font-weight: 800; color: #111; text-shadow: 0 1px 2px rgba(255,255,255,.72); }
    .cell-coordinate { position: absolute; inset: auto 1px 1px; font-size: 5px; line-height: 1; color: rgba(45,36,33,.62); }
    .filled .cell-coordinate { color: rgba(255,255,255,.78); text-shadow: 0 1px 2px rgba(0,0,0,.52); }
    .legend { width: 100%; font-size: 11px; }
    .legend th, .legend td { padding: 5px 4px; border-bottom: 1px solid #e5ddd4; text-align: left; }
    .legend th { color: #6f625b; font-weight: 700; }
    .legend-symbol { width: 26px; font-weight: 800; text-align: center !important; }
    .legend-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: var(--bead-color); border: 1px solid rgba(0,0,0,.16); vertical-align: middle; }
    .legend-title { margin: 0 0 8px; font-size: 15px; }
    @media print {
      .layout { grid-template-columns: minmax(0, 1fr) 235px; }
      .pattern td { min-width: 12px; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${escapedTitle}</h1>
    </div>
    <div class="meta">
      尺寸：${cols} × ${rows}<br />
      总数：${legend.reduce((sum, item) => sum + item.count, 0)} 颗<br />
      生成：${escapeHtml(generatedAt)}
    </div>
  </header>
  <main class="layout">
    <table class="pattern" aria-label="拼豆坐标图纸">
      <thead><tr><th></th>${colHeaders}</tr></thead>
      <tbody>${gridRows}
      </tbody>
    </table>
    <section>
      <h2 class="legend-title">色号清单</h2>
      <table class="legend">
        <thead>
          <tr><th>符号</th><th>颜色</th><th>品牌</th><th>色号</th><th>名称</th><th>数量</th></tr>
        </thead>
        <tbody>${legendRows}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}
