import { useState, useCallback } from 'react';
import { resolvePaletteValue } from '../lib/paletteValue.js';

/**
 * Custom hook for undo/redo history management (50 steps)
 */
export function useHistory(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistory = 50;

  const current = history[historyIndex];

  const push = useCallback((newState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const reset = useCallback((newState) => {
    setHistory([newState]);
    setHistoryIndex(0);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return { current, push, undo, redo, reset, canUndo, canRedo };
}

/**
 * Deep clone a 2D grid array
 */
export function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * Flood fill algorithm
 */
export function floodFill(grid, startX, startY, newColor) {
  const rows = grid.length;
  const cols = grid[0].length;
  const targetColor = grid[startY][startX];

  if (targetColor === newColor) return grid;

  const newGrid = cloneGrid(grid);
  const stack = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    if (newGrid[y][x] !== targetColor) continue;

    newGrid[y][x] = newColor;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return newGrid;
}

/**
 * Generate an empty grid
 */
export function createEmptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

/**
 * Count beads by color in a grid
 */
export function countBeads(grid, allColors = []) {
  const counts = {};
  for (const row of grid) {
    for (const cell of row) {
      if (cell) {
        const colorInfo = resolvePaletteValue(cell, allColors);
        const key = colorInfo?.id ?? cell;
        if (!counts[key]) {
          counts[key] = {
            key,
            value: key,
            hex: colorInfo?.hex ?? cell,
            count: 0,
            info: colorInfo || { brand: '?', code: '?', name: cell }
          };
        }
        counts[key].count++;
      }
    }
  }
  return Object.values(counts).sort((a, b) => b.count - a.count);
}
