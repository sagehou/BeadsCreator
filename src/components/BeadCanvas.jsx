import { useState, useRef, useCallback, useEffect } from 'react';

export default function BeadCanvas({
  grid,
  cellSize,
  showGrid,
  activeTool,
  selectedColor,
  onCellAction,
  onZoom,
  symmetry,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Keyboard handlers for space (pan mode)
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

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.3, Math.min(5, prev + delta)));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Context menu prevention
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Pan handlers
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

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDrawing(false);
  }, []);

  // Cell interaction
  const handleCellMouseDown = useCallback((x, y, e) => {
    if (spaceHeld) return;
    e.preventDefault();
    const isErase = e.button === 2;
    setIsDrawing(true);
    onCellAction(x, y, isErase ? 'erase' : activeTool);
  }, [activeTool, onCellAction, spaceHeld]);

  const handleCellMouseEnter = useCallback((x, y) => {
    if (isDrawing && !spaceHeld) {
      onCellAction(x, y, activeTool === 'eraser' ? 'erase' : activeTool === 'pencil' ? 'pencil' : null);
    }
  }, [isDrawing, activeTool, onCellAction, spaceHeld]);

  // Long press for mobile erase
  const longPressTimer = useRef(null);
  const handleTouchStart = useCallback((x, y) => {
    longPressTimer.current = setTimeout(() => {
      onCellAction(x, y, 'erase');
    }, 500);
    onCellAction(x, y, activeTool);
  }, [activeTool, onCellAction]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const cursorClass = spaceHeld || isPanning
    ? 'cursor-pan'
    : `cursor-${activeTool}`;

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
      <div
        className="canvas-container"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
      >
        <div
          className={`bead-canvas ${showGrid ? 'show-grid' : ''}`}
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
        >
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`bead-cell ${cell ? 'filled' : ''}`}
                style={{ backgroundColor: cell || 'transparent' }}
                onMouseDown={(e) => handleCellMouseDown(x, y, e)}
                onMouseEnter={() => handleCellMouseEnter(x, y)}
                onTouchStart={() => handleTouchStart(x, y)}
                onTouchEnd={handleTouchEnd}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
