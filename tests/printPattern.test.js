import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPrintLegend,
  createPrintablePatternHtml
} from '../src/lib/printPattern.js';

const palette = [
  { id: 'MARD:A1', brand: 'MARD', code: 'A1', name: '黑色<script>', hex: '#101010' },
  { id: 'MARD:B2', brand: 'MARD', code: 'B2', name: '亮黄', hex: '#FFE047' }
];

test('buildPrintLegend creates stable symbols and counts from the grid', () => {
  const grid = [
    ['MARD:A1', null],
    ['MARD:B2', 'MARD:A1']
  ];

  assert.deepEqual(buildPrintLegend(grid, palette), [
    {
      symbol: '1',
      value: 'MARD:A1',
      hex: '#101010',
      brand: 'MARD',
      code: 'A1',
      name: '黑色<script>',
      count: 2
    },
    {
      symbol: '2',
      value: 'MARD:B2',
      hex: '#FFE047',
      brand: 'MARD',
      code: 'B2',
      name: '亮黄',
      count: 1
    }
  ]);
});

test('createPrintablePatternHtml includes coordinates, legend, and escaped text', () => {
  const html = createPrintablePatternHtml({
    grid: [
      ['MARD:A1', null],
      ['MARD:B2', 'MARD:A1']
    ],
    allColors: palette,
    title: '图纸 <测试>'
  });

  assert.match(html, /<title>图纸 &lt;测试&gt;<\/title>/);
  assert.match(html, /data-coordinate="1,1"/);
  assert.match(html, /data-coordinate="2,2"/);
  assert.match(html, /尺寸：2 × 2/);
  assert.match(html, /总数：3 颗/);
  assert.match(html, /aria-label="拼豆坐标图纸"/);
  assert.match(html, /色号清单/);
  assert.match(html, /class="pattern-cell filled/);
  assert.match(html, /class="cell-number">1<\/span>/);
  assert.match(html, /class="legend-grid"/);
  assert.match(html, /class="legend-item"/);
  assert.match(html, /打印 \/ 另存为 PDF/);
  assert.match(html, /MARD A1/);
  assert.match(html, /×2/);
  assert.match(html, /黑色&lt;script&gt;/);
  assert.doesNotMatch(html, /黑色<script>/);
  assert.match(html, /guide-5/);
  assert.doesNotMatch(html, /\{cols\}|\{legend\.reduce|\{escapeHtml/);
});

test('createPrintablePatternHtml uses a print-focused A4 sheet with compact legend', () => {
  const grid = Array.from({ length: 6 }, (_, y) => (
    Array.from({ length: 6 }, (_, x) => ((x + y) % 2 === 0 ? 'MARD:A1' : 'MARD:B2'))
  ));

  const html = createPrintablePatternHtml({
    grid,
    allColors: palette,
    title: '拼豆图纸'
  });

  assert.match(html, /@page \{ size: A4; margin: 10mm; \}/);
  assert.match(html, /class="print-sheet"/);
  assert.match(html, /class="pattern-grid"/);
  assert.match(html, /grid-template-columns:24px repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(html, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /data-coordinate="5,5"/);
  assert.match(html, /共 2 色 · 36 颗/);
  assert.match(html, /window\.print\(\)/);
});
