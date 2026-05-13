function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function calculateSourceCrop({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  zoom = 1,
  offsetX = 0,
  offsetY = 0
}) {
  const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
  const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
  const safeTargetWidth = Math.max(1, Number(targetWidth) || 1);
  const safeTargetHeight = Math.max(1, Number(targetHeight) || 1);
  const safeZoom = clamp(Number(zoom) || 1, 1, 4);
  const targetAspect = safeTargetWidth / safeTargetHeight;
  const sourceAspect = safeSourceWidth / safeSourceHeight;

  let baseWidth = safeSourceWidth;
  let baseHeight = safeSourceHeight;
  if (sourceAspect > targetAspect) {
    baseWidth = safeSourceHeight * targetAspect;
  } else {
    baseHeight = safeSourceWidth / targetAspect;
  }

  const width = Math.max(1, baseWidth / safeZoom);
  const height = Math.max(1, baseHeight / safeZoom);
  const maxX = Math.max(0, safeSourceWidth - width);
  const maxY = Math.max(0, safeSourceHeight - height);
  const normalizedOffsetX = clamp(Number(offsetX) || 0, -1, 1);
  const normalizedOffsetY = clamp(Number(offsetY) || 0, -1, 1);

  return {
    x: Math.round(maxX / 2 + normalizedOffsetX * maxX / 2),
    y: Math.round(maxY / 2 + normalizedOffsetY * maxY / 2),
    width: Math.round(width),
    height: Math.round(height)
  };
}
