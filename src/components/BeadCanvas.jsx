import { useState, useRef, useCallback, useEffect } from 'react';
import { MARD_COLORS } from '../data/colors';
import { fitCanvasView, nextCanvasScale } from '../lib/canvasView';
import { hexForPaletteValue } from '../lib/paletteValue';
import { canvasPreviewClassName } from '../lib/previewModes';
import { normalizeSelectionRect, pointInRect } from '../lib/selectionGrid';
import { toolCursorClass } from '../lib/toolConfig';

function movedRect(rect, delta) {
  if (!rect || !delta) return null;
  return {
    ...rect,
    x: rect.x + delta.dx,
    y: rect.y + delta.dy
  };
}

export default function BeadCanvas({
  grid,
  cellSize,
  showGrid,
  activeTool,
  onCellAction,
  onTextStart,
  selectionRect,
  selectionPreviewRect,
  selectionMoveDelta,
  onSelectionPreview,
  onSelectionCommit,
  onSelectionMovePreview,
  onSelectionMoveCommit,
  previewMode = 'bead',
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const selectionDrag = useRef(null);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const displayedSelection = selectionPreviewRect ?? selectionRect;
  const displayedMoveRect = movedRect(selectionRect, selectionMoveDelta);

  const fitToScreen = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const view = fitCanvasView({
      rows,
      cols,
      cellSize,
      viewportWidth: rect.width,
      viewportHeight: rect.height,
      padding: 48
    });
    setScale(view.scale);
    setOffset(view.offset);
  }, [cellSize, cols, rows]);

  const resetActualSize = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setScale(1);
    setOffset({
      x: Math.round((rect.width - cols * cellSize) / 2),
      y: Math.round((rect.height - rows * cellSize) / 2)
    });
  }, [cellSize, cols, rows]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale(prev => nextCanvasScale(prev, e.deltaY > 0 ? -1 : 1));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (spaceHeld || e.button === 1) {
      setIsPanning(true);
      panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      e.preventDefault();
    }
  }, [spaceHeld, offset]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      });
    }
  }, [isPanning]);

  const finishSelectionDrag = useCallback(() => {
    const drag = selectionDrag.current;
    if (!drag) return;

    if (drag.type === 'move') {
      const dx = drag.current.x - drag.start.x;
      const dy = drag.current.y - drag.start.y;
      onSelectionMoveCommit?.(dx, dy);
    } else {
      onSelectionCommit?.(normalizeSelectionRect(drag.start, drag.current));
    }
    selectionDrag.current = null;
  }, [onSelectionCommit, onSelectionMoveCommit]);

  const handleMouseUp = useCallback(() => {
    finishSelectionDrag();
    setIsPanning(false);
    setIsDrawing(false);
  }, [finishSelectionDrag]);

  const handleCellMouseDown = useCallback((x, y, e) => {
    if (spaceHeld) return;
    e.preventDefault();

    if (activeTool === 'text') {
      onTextStart?.(x, y);
      return;
    }

    if (activeTool === 'select') {
      const point = { x, y };
      const movingSelection = selectionRect && pointInRect(point, selectionRect);
      selectionDrag.current = {
        type: movingSelection ? 'move' : 'select',
        start: point,
        current: point
      };
      if (movingSelection) {
        onSelectionMovePreview?.(0, 0);
      } else {
        onSelectionPreview?.(normalizeSelectionRect(point, point));
      }
      return;
    }

    const isErase = e.button === 2;
    setIsDrawing(true);
    onCellAction(x, y, isErase ? 'erase' : activeTool);
  }, [
    activeTool,
    onCellAction,
    onSelectionMovePreview,
    onSelectionPreview,
    onTextStart,
    selectionRect,
    spaceHeld
  ]);

  const handleCellMouseEnter = useCallback((x, y) => {
    const drag = selectionDrag.current;
    if (drag) {
      drag.current = { x, y };
      if (drag.type === 'move') {
        onSelectionMovePreview?.(x - drag.start.x, y - drag.start.y);
      } else {
        onSelectionPreview?.(normalizeSelectionRect(drag.start, drag.current));
      }
      return;
    }

    if (isDrawing && !spaceHeld) {
      onCellAction(x, y, activeTool === 'eraser' ? 'erase' : activeTool === 'pencil' ? 'pencil' : null);
    }
  }, [isDrawing, activeTool, onCellAction, onSelectionMovePreview, onSelectionPreview, spaceHeld]);

  const longPressTimer = useRef(null);
  const handleTouchStart = useCallback((x, y) => {
    if (activeTool === 'text') {
      onTextStart?.(x, y);
      return;
    }
    if (activeTool === 'select') return;

    longPressTimer.current = setTimeout(() => {
      onCellAction(x, y, 'erase');
    }, 500);
    onCellAction(x, y, activeTool);
  }, [activeTool, onCellAction, onTextStart]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const cursorClass = spaceHeld || isPanning
    ? 'cursor-pan'
    : toolCursorClass(activeTool);

  return (
    <div
      className={`canvas-area ${cursorClass}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      <div className="canvas-view-controls" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" title="缩小" onClick={() => setScale(prev => nextCanvasScale(prev, -1))}>-</button>
        <span>{Math.round(scale * 100)}%</span>
        <button type="button" title="放大" onClick={() => setScale(prev => nextCanvasScale(prev, 1))}>+</button>
        <button type="button" title="实际大小" onClick={resetActualSize}>1:1</button>
        <button type="button" title="适配画布" onClick={fitToScreen}>适配</button>
      </div>
      <div
        className="canvas-container"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        <div
          className={canvasPreviewClassName(showGrid, previewMode)}
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => {
              const cellHex = cell ? hexForPaletteValue(cell, MARD_COLORS) : null;
              const selected = pointInRect({ x, y }, displayedSelection);
              const moveTarget = pointInRect({ x, y }, displayedMoveRect);
              const classNames = [
                'bead-cell',
                cell ? 'filled' : '',
                selected ? 'selection-cell' : '',
                moveTarget ? 'selection-target' : ''
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={`${x}-${y}`}
                  className={classNames}
                  style={{ backgroundColor: cellHex || 'transparent' }}
                  onMouseDown={(e) => handleCellMouseDown(x, y, e)}
                  onMouseEnter={() => handleCellMouseEnter(x, y)}
                  onTouchStart={() => handleTouchStart(x, y)}
                  onTouchEnd={handleTouchEnd}
                >
                  <span className="cell-coordinate">{x + 1},{y + 1}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
