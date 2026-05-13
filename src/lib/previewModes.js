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
