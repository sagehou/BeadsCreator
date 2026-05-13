export const MIN_CANVAS_SCALE = 0.3;
export const MAX_CANVAS_SCALE = 5;
export const CANVAS_ZOOM_STEP = 0.1;

function roundScale(value) {
  return Math.round(value * 100) / 100;
}

export function clampCanvasScale(scale) {
  return Math.max(MIN_CANVAS_SCALE, Math.min(MAX_CANVAS_SCALE, roundScale(scale)));
}

export function nextCanvasScale(currentScale, direction, step = CANVAS_ZOOM_STEP) {
  return clampCanvasScale(currentScale + direction * step);
}

export function fitCanvasView({
  rows,
  cols,
  cellSize,
  viewportWidth,
  viewportHeight,
  padding = 0
}) {
  const boardWidth = Math.max(1, cols * cellSize);
  const boardHeight = Math.max(1, rows * cellSize);
  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);
  const scale = clampCanvasScale(Math.min(
    1,
    availableWidth / boardWidth,
    availableHeight / boardHeight
  ));
  const scaledWidth = boardWidth * scale;
  const scaledHeight = boardHeight * scale;

  return {
    scale,
    offset: {
      x: Math.round((viewportWidth - scaledWidth) / 2),
      y: Math.round((viewportHeight - scaledHeight) / 2)
    }
  };
}
