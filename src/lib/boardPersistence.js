export const BOARD_STORAGE_KEY = 'beadscreator.board.v1';
export const PROJECT_FILE_APP = 'BeadsCreator';
export const PROJECT_FILE_VERSION = 1;
export const DEFAULT_EXPORT_SCALE = 2;
export const DEFAULT_PREVIEW_MODE = 'bead';

const VALID_PREVIEW_MODES = new Set(['bead', 'iron', 'towel', 'fine-glitter', 'coarse-glitter']);

function defaultStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function isValidGrid(grid) {
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) return false;

  const cols = grid[0].length;
  if (cols === 0) return false;

  return grid.every((row) => (
    Array.isArray(row) &&
    row.length === cols &&
    row.every((cell) => cell === null || typeof cell === 'string')
  ));
}

function normalizeBoardState(state) {
  if (!state || !isValidGrid(state.grid)) return null;

  const rows = state.grid.length;
  const cols = state.grid[0].length;
  const gridSize = state.gridSize?.rows === rows && state.gridSize?.cols === cols
    ? state.gridSize
    : { rows, cols };
  const exportScale = Number.isInteger(state.exportScale) && state.exportScale >= 1 && state.exportScale <= 4
    ? state.exportScale
    : DEFAULT_EXPORT_SCALE;
  const previewMode = VALID_PREVIEW_MODES.has(state.previewMode)
    ? state.previewMode
    : DEFAULT_PREVIEW_MODE;

  return {
    grid: state.grid,
    gridSize,
    selectedColor: typeof state.selectedColor === 'string' ? state.selectedColor : undefined,
    recentColors: Array.isArray(state.recentColors)
      ? state.recentColors.filter((value) => typeof value === 'string').slice(0, 8)
      : [],
    exportScale,
    previewMode
  };
}

export function createProjectFile(state, options = {}) {
  const normalized = normalizeBoardState(state);
  if (!normalized) throw new Error('Invalid board state');

  return JSON.stringify({
    app: PROJECT_FILE_APP,
    version: PROJECT_FILE_VERSION,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    board: normalized
  }, null, 2);
}

export function parseProjectFile(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.app === PROJECT_FILE_APP || parsed?.board) {
      if (parsed.app !== PROJECT_FILE_APP || parsed.version !== PROJECT_FILE_VERSION) return null;
      return normalizeBoardState(parsed.board);
    }

    return normalizeBoardState(parsed);
  } catch {
    return null;
  }
}

export function loadBoardState(storage = defaultStorage()) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(BOARD_STORAGE_KEY);
    if (!raw) return null;
    return normalizeBoardState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveBoardState(storage = defaultStorage(), state) {
  if (!storage) return;

  const normalized = normalizeBoardState(state);
  if (!normalized) {
    storage.removeItem?.(BOARD_STORAGE_KEY);
    return;
  }

  storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(normalized));
}
