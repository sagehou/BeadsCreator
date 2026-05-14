export function hasTargetSizeChanged(previousTarget, nextTarget) {
  if (!previousTarget) return true;
  return previousTarget.rows !== nextTarget.rows || previousTarget.cols !== nextTarget.cols;
}

export function createImageConversionRequest({
  source,
  target,
  paletteColors,
  maxColors,
  cleanupThreshold,
  bucketSize,
  enhanceEdges,
  preprocessMode = 'cartoon',
  preprocessOptions = {},
  sourceCrop = null,
  outlineMode = 'none',
  outlineColor = '#000000',
  outlineWidth = 1,
  removeBackground = false,
  colorLimit = 0
}) {
  return {
    imageData: source.imageData,
    sourceWidth: source.width,
    sourceHeight: source.height,
    width: target.cols,
    height: target.rows,
    paletteColors,
    maxColors,
    cleanupThreshold,
    bucketSize,
    enhanceEdges,
    preprocessMode,
    preprocessOptions,
    sourceCrop,
    outlineMode,
    outlineColor,
    outlineWidth,
    removeBackground,
    colorLimit
  };
}
