export const IMAGE_IMPORT_PRESETS = {
  portrait: {
    id: 'portrait',
    label: '头像',
    cleanupThreshold: 1,
    removeBackground: false,
    colorLimit: 18,
    bucketSize: 14,
    preprocessMode: 'cartoon',
    preprocessOptions: {
      smoothingRadius: 1,
      colorThreshold: 44,
      posterizeStep: 12,
      saturation: 1.08,
      contrast: 1.04,
      detailSpread: 1,
      detailStrength: 0.48,
      detailThreshold: 44
    }
  },
  photo: {
    id: 'photo',
    label: '照片',
    cleanupThreshold: 2,
    removeBackground: false,
    colorLimit: 24,
    bucketSize: 16,
    preprocessMode: 'cartoon',
    preprocessOptions: {
      smoothingRadius: 2,
      colorThreshold: 52,
      posterizeStep: 14,
      saturation: 1.06,
      contrast: 1.03,
      detailSpread: 1,
      detailStrength: 0.34,
      detailThreshold: 56
    }
  },
  icon: {
    id: 'icon',
    label: '图标',
    cleanupThreshold: 0,
    removeBackground: true,
    colorLimit: 12,
    bucketSize: 8,
    preprocessMode: 'cartoon',
    preprocessOptions: {
      smoothingRadius: 0,
      colorThreshold: 28,
      posterizeStep: 8,
      saturation: 1.16,
      contrast: 1.12,
      detailSpread: 1,
      detailStrength: 0.5,
      detailThreshold: 36
    }
  },
  lineArt: {
    id: 'lineArt',
    label: '线稿',
    cleanupThreshold: 0,
    removeBackground: true,
    colorLimit: 8,
    bucketSize: 6,
    preprocessMode: 'cartoon',
    preprocessOptions: {
      smoothingRadius: 0,
      colorThreshold: 24,
      posterizeStep: 6,
      saturation: 1,
      contrast: 1.28,
      detailSpread: 1,
      detailStrength: 0.72,
      detailThreshold: 28
    }
  },
  pixel: {
    id: 'pixel',
    label: '像素画',
    cleanupThreshold: 0,
    removeBackground: false,
    colorLimit: 0,
    bucketSize: 1,
    preprocessMode: 'none',
    preprocessOptions: {}
  }
};

export function imageImportPresetOptions(presetId) {
  return IMAGE_IMPORT_PRESETS[presetId] ?? IMAGE_IMPORT_PRESETS.portrait;
}
