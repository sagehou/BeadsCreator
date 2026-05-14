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
  assert.match(html, /<th>符号<\/th><th>颜色<\/th><th>品牌<\/th><th>色号<\/th><th>名称<\/th><th>数量<\/th>/);
  assert.match(html, />MARD<\/td>\s*<td>A1<\/td>/);
  assert.match(html, />2<\/td>/);
  assert.match(html, /黑色&lt;script&gt;/);
  assert.doesNotMatch(html, /黑色<script>/);
  assert.match(html, /guide-5/);
  assert.doesNotMatch(html, /\{cols\}|\{legend\.reduce|\{escapeHtml/);
});
