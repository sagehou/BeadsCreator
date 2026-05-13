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
  enhanceEdges
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
    enhanceEdges
  };
}
