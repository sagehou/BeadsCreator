import { useState, useCallback, useEffect, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import ColorPalette from './components/ColorPalette';
import BeadCanvas from './components/BeadCanvas';
import BomPanel from './components/BomPanel';
import ImageConverter from './components/ImageConverter';
import { useHistory, cloneGrid, floodFill, createEmptyGrid, countBeads } from './hooks/useBeadBoard';
import { generateSmileyPattern, getAllColors } from './data/colors';
import { PREVIEW_MODE_OPTIONS, PREVIEW_MODES, exportPreviewStyleForMode } from './lib/previewModes';

const DEFAULT_SIZE = 29;
const CELL_SIZE = 18;

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function App() {
  const initialGrid = useMemo(() => generateSmileyPattern(), []);
  const { current: grid, push, undo, redo, reset, canUndo, canRedo } = useHistory(initialGrid);

  const [gridSize, setGridSize] = useState({ rows: DEFAULT_SIZE, cols: DEFAULT_SIZE });
  const [selectedColor, setSelectedColor] = useState('#FFD700');
  const [activeTool, setActiveTool] = useState('pencil');
  const [showGrid, setShowGrid] = useState(true);
  const [symmetry, setSymmetry] = useState(false);
  const [recentColors, setRecentColors] = useState([]);
  const [exportScale, setExportScale] = useState(2);
  const [previewMode, setPreviewMode] = useState(PREVIEW_MODES.BEAD);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Add color to recent
  const addRecent = useCallback((hex) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== hex);
      return [hex, ...filtered].slice(0, 8);
    });
  }, []);

  // Select color handler
  const handleSelectColor = useCallback((hex) => {
    setSelectedColor(hex);
    addRecent(hex);
  }, [addRecent]);

  // Cell action handler
  const handleCellAction = useCallback((x, y, tool) => {
    if (!tool) return;
    let newGrid;

    switch (tool) {
      case 'pencil': {
        newGrid = cloneGrid(grid);
        newGrid[y][x] = selectedColor;
        if (symmetry) {
          const mirrorX = grid[0].length - 1 - x;
          if (mirrorX !== x) newGrid[y][mirrorX] = selectedColor;
        }
        break;
      }
      case 'erase':
      case 'eraser': {
        newGrid = cloneGrid(grid);
        newGrid[y][x] = null;
        if (symmetry) {
          const mirrorX = grid[0].length - 1 - x;
          if (mirrorX !== x) newGrid[y][mirrorX] = null;
        }
        break;
      }
      case 'bucket': {
        newGrid = floodFill(grid, x, y, selectedColor);
        break;
      }
      case 'eyedropper': {
        if (grid[y][x]) {
          handleSelectColor(grid[y][x]);
        }
        return;
      }
      default:
        return;
    }

    if (newGrid) push(newGrid);
  }, [grid, selectedColor, symmetry, push, handleSelectColor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Resize grid
  const handleResize = useCallback((newRows, newCols) => {
    newRows = Math.max(10, Math.min(50, newRows));
    newCols = Math.max(10, Math.min(50, newCols));
    const newGrid = createEmptyGrid(newRows, newCols);
    // Copy existing data
    for (let y = 0; y < Math.min(grid.length, newRows); y++) {
      for (let x = 0; x < Math.min(grid[0].length, newCols); x++) {
        newGrid[y][x] = grid[y][x];
      }
    }
    setGridSize({ rows: newRows, cols: newCols });
    reset(newGrid);
  }, [grid, reset]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const newGrid = createEmptyGrid(gridSize.rows, gridSize.cols);
    push(newGrid);
    setShowClearConfirm(false);
  }, [gridSize, push]);

  // Image convert handler
  const handleImageConvert = useCallback((newGrid) => {
    setGridSize({ rows: newGrid.length, cols: newGrid[0].length });
    push(newGrid);
  }, [push]);

  // Export PNG
  const handleExportPng = useCallback(() => {
    const rows = grid.length;
    const cols = grid[0].length;
    const s = exportScale * CELL_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = cols * s;
    canvas.height = rows * s;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const exportStyle = exportPreviewStyleForMode(previewMode);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x]) {
          ctx.fillStyle = grid[y][x];
          if (exportStyle.shape === 'roundedRect') {
            const inset = s * exportStyle.insetRatio;
            const size = s - inset * 2;
            drawRoundedRect(ctx, x * s + inset, y * s + inset, size, size, size * exportStyle.cornerRadiusRatio);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x * s + s / 2, y * s + s / 2, s * exportStyle.radiusRatio, 0, Math.PI * 2);
            ctx.fill();
          }

          if (exportStyle.sparkleRadiusRatio) {
            ctx.fillStyle = 'rgba(255,255,255,0.62)';
            ctx.beginPath();
            ctx.arc(x * s + s * 0.36, y * s + s * 0.34, s * exportStyle.sparkleRadiusRatio, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * s, 0);
      ctx.lineTo(x * s, rows * s);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * s);
      ctx.lineTo(cols * s, y * s);
      ctx.stroke();
    }

    const link = document.createElement('a');
    link.download = `beads_${cols}x${rows}_${exportScale}x.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [grid, exportScale, previewMode]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const allColors = getAllColors();
    const beadCounts = countBeads(grid, allColors);
    const header = '颜色,品牌,色号,名称,数量\n';
    const rows = beadCounts.map(item =>
      `${item.hex},${item.info?.brand || ''},${item.info?.code || ''},${item.info?.name || ''},${item.count}`
    ).join('\n');
    const bom = '\uFEFF' + header + rows;
    const blob = new Blob([bom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = 'beads_bom.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [grid]);

  // Count total beads
  const totalBeads = useMemo(() => {
    let count = 0;
    for (const row of grid) for (const cell of row) if (cell) count++;
    return count;
  }, [grid]);

  const toolNames = { pencil: '铅笔', eraser: '橡皮', bucket: '油漆桶', eyedropper: '吸管' };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">🫧</span>
          <span>拼豆画板</span>
        </div>

        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          symmetry={symmetry}
          onToggleSymmetry={() => setSymmetry(s => !s)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(s => !s)}
        />

        <div className="header-controls">
          <div className="size-control">
            <input
              className="size-input"
              type="number"
              min="10"
              max="50"
              value={gridSize.cols}
              onChange={(e) => handleResize(gridSize.rows, Number(e.target.value))}
            />
            <span>×</span>
            <input
              className="size-input"
              type="number"
              min="10"
              max="50"
              value={gridSize.rows}
              onChange={(e) => handleResize(Number(e.target.value), gridSize.cols)}
            />
          </div>
          <button className="header-btn" onClick={() => setShowClearConfirm(true)}>
            🗑️ 清空
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="app-main">
        {/* Left: Palette + Image Converter */}
        <div className="palette-panel">
          <ColorPalette
            selectedColor={selectedColor}
            onSelectColor={handleSelectColor}
            recentColors={recentColors}
          />
          <div style={{ borderTop: '1px solid rgba(93,64,55,0.08)', marginTop: 8, paddingTop: 8 }}>
            <ImageConverter
              gridRows={gridSize.rows}
              gridCols={gridSize.cols}
              onConvert={handleImageConvert}
            />
          </div>
        </div>

        {/* Center: Canvas */}
        <BeadCanvas
          grid={grid}
          cellSize={CELL_SIZE}
          showGrid={showGrid}
          activeTool={activeTool}
          selectedColor={selectedColor}
          onCellAction={handleCellAction}
          symmetry={symmetry}
          previewMode={previewMode}
        />

        {/* Right: BOM */}
        <BomPanel
          grid={grid}
          exportScale={exportScale}
          previewMode={previewMode}
          previewModes={PREVIEW_MODE_OPTIONS}
          onExportScaleChange={setExportScale}
          onPreviewModeChange={setPreviewMode}
          onExportPng={handleExportPng}
          onExportCsv={handleExportCsv}
        />
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-dot" />
          <span>{gridSize.cols}×{gridSize.rows}</span>
        </div>
        <div className="status-item">🔵 {totalBeads} 颗</div>
        <div className="status-item">🔧 {toolNames[activeTool]}</div>
        {symmetry && <div className="status-item">🪞 对称模式</div>}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">⚠️ 确认清空画布？</div>
            <p style={{ color: '#8D6E63', fontSize: '0.9rem' }}>
              此操作将清除画布上所有拼豆，确定要继续吗？
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowClearConfirm(false)}>取消</button>
              <button className="modal-btn confirm" onClick={handleClear}>确认清空</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
