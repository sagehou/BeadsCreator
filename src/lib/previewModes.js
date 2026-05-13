export const PREVIEW_MODES = {
  BEAD: 'bead',
  IRON: 'iron',
  TOWEL: 'towel',
  FINE_GLITTER: 'fine-glitter',
  COARSE_GLITTER: 'coarse-glitter'
};

export const PREVIEW_MODE_OPTIONS = [
  { id: PREVIEW_MODES.BEAD, label: '拼豆' },
  { id: PREVIEW_MODES.IRON, label: '普通烫' },
  { id: PREVIEW_MODES.TOWEL, label: '毛巾烫' },
  { id: PREVIEW_MODES.FINE_GLITTER, label: '细闪' },
  { id: PREVIEW_MODES.COARSE_GLITTER, label: '粗闪' }
];

export function previewModeClassName(mode) {
  return Object.values(PREVIEW_MODES).includes(mode)
    ? `preview-${mode}`
    : 'preview-bead';
}

export function canvasPreviewClassName(showGrid, mode) {
  return [
    'bead-canvas',
    showGrid ? 'show-grid' : '',
    previewModeClassName(mode)
  ].filter(Boolean).join(' ');
}

export function cloneGridForPreview(grid) {
  return grid.map((row) => [...row]);
}

export function exportPreviewStyleForMode(mode) {
  switch (mode) {
    case PREVIEW_MODES.IRON:
      return {
        shape: 'roundedRect',
        insetRatio: 0.08,
        cornerRadiusRatio: 0.42
      };
    case PREVIEW_MODES.TOWEL:
      return {
        shape: 'roundedRect',
        insetRatio: 0.07,
        cornerRadiusRatio: 0.38
      };
    case PREVIEW_MODES.FINE_GLITTER:
      return {
        shape: 'circle',
        radiusRatio: 0.4,
        sparkleRadiusRatio: 0.045
      };
    case PREVIEW_MODES.COARSE_GLITTER:
      return {
        shape: 'circle',
        radiusRatio: 0.4,
        sparkleRadiusRatio: 0.08
      };
    case PREVIEW_MODES.BEAD:
    default:
      return {
        shape: 'circle',
        radiusRatio: 0.4
      };
  }
}
