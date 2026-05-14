import { useState, useRef, useCallback, useEffect } from 'react';
import { MARD_COLORS } from '../data/colors';
import { calculateSourceCrop } from '../lib/imageCrop';
import { createImageConversionRequest, hasTargetSizeChanged } from '../lib/imageConversionRequest';
import { IMAGE_IMPORT_PRESETS, imageImportPresetOptions } from '../lib/imageImportPresets';

const paletteColors = MARD_COLORS;
const maxColors = 16;
const enhanceEdges = false;

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function isFileDrag(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export default function ImageConverter({ gridRows, gridCols, onConvert, compact = false }) {
  const [dragOver, setDragOver] = useState(false);
  const [pageDragOver, setPageDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importPreset, setImportPreset] = useState('portrait');
  const [cleanupThreshold, setCleanupThreshold] = useState(imageImportPresetOptions('portrait').cleanupThreshold);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [outlineMode, setOutlineMode] = useState('none');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [outlineWidth, setOutlineWidth] = useState(1);
  const [removeBackground, setRemoveBackground] = useState(imageImportPresetOptions('portrait').removeBackground);
  const [colorLimit, setColorLimit] = useState(imageImportPresetOptions('portrait').colorLimit);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const sourceRef = useRef(null);
  const lastTargetRef = useRef(null);
  const presetOptions = imageImportPresetOptions(importPreset);
  const optionsSignature = [
    importPreset,
    cleanupThreshold,
    cropZoom,
    cropOffsetX,
    cropOffsetY,
    outlineMode,
    outlineColor,
    outlineWidth,
    removeBackground,
    colorLimit
  ].join('|');
  const lastOptionsSignatureRef = useRef(optionsSignature);
  const jobIdRef = useRef(0);

  const runConversion = useCallback((source, target) => {
    if (!source) return;

    const jobId = jobIdRef.current + 1;
    jobIdRef.current = jobId;
    lastTargetRef.current = target;
    lastOptionsSignatureRef.current = optionsSignature;
    setProcessing(true);
    setProgress(0);

    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(
      new URL('../workers/kmeansWorker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (jobId !== jobIdRef.current) return;

      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.progress);
      } else if (msg.type === 'complete') {
        if (msg.resultGrid) {
          onConvert(msg.resultGrid);
        } else {
          const newGrid = [];
          for (let y = 0; y < msg.height; y += 1) {
            const row = [];
            for (let x = 0; x < msg.width; x += 1) {
              const idx = msg.result[y * msg.width + x];
              row.push(paletteColors[idx].hex);
            }
            newGrid.push(row);
          }
          onConvert(newGrid);
        }
        setProcessing(false);
        setProgress(100);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      } else if (msg.type === 'error') {
        console.error('Worker error:', msg.error);
        setProcessing(false);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      }
    };

    worker.postMessage(createImageConversionRequest({
      source,
      target,
      paletteColors,
      maxColors,
      cleanupThreshold,
      bucketSize: presetOptions.bucketSize,
      enhanceEdges,
      preprocessMode: presetOptions.preprocessMode,
      preprocessOptions: presetOptions.preprocessOptions,
      sourceCrop: calculateSourceCrop({
        sourceWidth: source.width,
        sourceHeight: source.height,
        targetWidth: target.cols,
        targetHeight: target.rows,
        zoom: cropZoom,
        offsetX: cropOffsetX,
        offsetY: cropOffsetY
      }),
      outlineMode,
      outlineColor,
      outlineWidth,
      removeBackground,
      colorLimit
    }));
  }, [
    colorLimit,
    cleanupThreshold,
    cropOffsetX,
    cropOffsetY,
    cropZoom,
    onConvert,
    optionsSignature,
    outlineColor,
    outlineMode,
    outlineWidth,
    removeBackground,
    presetOptions
  ]);

  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setProcessing(true);
    setProgress(0);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const source = {
        imageData: imageData.data,
        width: imageData.width,
        height: imageData.height
      };
      sourceRef.current = source;
      runConversion(source, { rows: gridRows, cols: gridCols });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setProcessing(false);
    };

    img.src = url;
  }, [gridRows, gridCols, runConversion]);

  useEffect(() => {
    const source = sourceRef.current;
    if (!source) return;

    const target = { rows: gridRows, cols: gridCols };
    if (hasTargetSizeChanged(lastTargetRef.current, target)) {
      runConversion(source, target);
    }
  }, [gridRows, gridCols, runConversion]);

  useEffect(() => {
    const source = sourceRef.current;
    if (!source || lastOptionsSignatureRef.current === optionsSignature) return;
    runConversion(source, { rows: gridRows, cols: gridCols });
  }, [optionsSignature, gridRows, gridCols, runConversion]);

  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  useEffect(() => {
    const handleWindowDragOver = (event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setPageDragOver(true);
    };
    const handleWindowDragLeave = (event) => {
      if (
        event.clientX > 0 &&
        event.clientY > 0 &&
        event.clientX < window.innerWidth &&
        event.clientY < window.innerHeight
      ) {
        return;
      }
      setPageDragOver(false);
    };
    const handleWindowDrop = (event) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      setPageDragOver(false);
      processImage(event.dataTransfer.files?.[0]);
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [processImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processImage(e.dataTransfer.files[0]);
  }, [processImage]);

  const handleFileSelect = useCallback((e) => {
    processImage(e.target.files[0]);
    e.target.value = '';
  }, [processImage]);

  const handlePresetChange = useCallback((presetId) => {
    const nextPreset = imageImportPresetOptions(presetId);
    setImportPreset(nextPreset.id);
    setCleanupThreshold(nextPreset.cleanupThreshold);
    setRemoveBackground(nextPreset.removeBackground);
    setColorLimit(nextPreset.colorLimit);
  }, []);

  const resetCrop = useCallback(() => {
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  }, []);

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleFileSelect}
    />
  );

  if (compact) {
    return (
      <>
        <div className="toolbar-import">
          <button
            className={`tool-btn import-tool-btn ${processing ? 'processing' : ''}`}
            type="button"
            title="导入图片"
            aria-label="导入图片"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
          </button>
          {hiddenInput}
          {processing && (
            <div className="toolbar-import-progress" style={{ width: `${progress}%` }} />
          )}
        </div>
        {pageDragOver && (
          <div className="page-drop-overlay">
            <div>松开导入图片</div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="image-converter-card">
      <div className="palette-section-title">导入图片</div>

      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">🖼️</div>
        <div>点击或拖拽图片生成图纸</div>
        {hiddenInput}
      </div>

      <div className="upload-options">
        <div className="upload-option">
          <label>类型</label>
          <select
            value={importPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="compact-select"
          >
            {Object.values(IMAGE_IMPORT_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
        </div>
        <div className="upload-option">
          <label>缩放</label>
          <input
            type="range"
            min="100"
            max="300"
            value={Math.round(cropZoom * 100)}
            onChange={(e) => setCropZoom(Number(e.target.value) / 100)}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.78rem', minWidth: 34, textAlign: 'right' }}>{Math.round(cropZoom * 100)}%</span>
        </div>
        <div className="upload-option">
          <label>水平</label>
          <input
            type="range"
            min="-100"
            max="100"
            value={Math.round(cropOffsetX * 100)}
            onChange={(e) => setCropOffsetX(Number(e.target.value) / 100)}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.78rem', minWidth: 30, textAlign: 'right' }}>{Math.round(cropOffsetX * 100)}</span>
        </div>
        <div className="upload-option">
          <label>垂直</label>
          <input
            type="range"
            min="-100"
            max="100"
            value={Math.round(cropOffsetY * 100)}
            onChange={(e) => setCropOffsetY(Number(e.target.value) / 100)}
            style={{ flex: 1 }}
          />
          <button className="mini-option-btn" type="button" onClick={resetCrop}>居中</button>
        </div>
        <div className="upload-option">
          <label>去杂色</label>
          <input
            type="range"
            min="0"
            max="8"
            value={cleanupThreshold}
            onChange={(e) => setCleanupThreshold(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.78rem', minWidth: 22, textAlign: 'right' }}>{cleanupThreshold}</span>
        </div>
        <div className="upload-option">
          <label>去背景</label>
          <input
            type="checkbox"
            checked={removeBackground}
            onChange={(e) => setRemoveBackground(e.target.checked)}
          />
        </div>
        <div className="upload-option">
          <label>颜色上限</label>
          <input
            type="range"
            min="0"
            max="32"
            value={colorLimit}
            onChange={(e) => setColorLimit(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.78rem', minWidth: 34, textAlign: 'right' }}>{colorLimit || '不限'}</span>
        </div>
        <div className="upload-option">
          <label>描边</label>
          <select
            value={outlineMode}
            onChange={(e) => setOutlineMode(e.target.value)}
            className="compact-select"
          >
            <option value="none">关闭</option>
            <option value="auto">自动</option>
            <option value="black">黑边</option>
            <option value="white">白边</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        {outlineMode !== 'none' && (
          <div className="upload-option">
            <label>粗细</label>
            <input
              type="range"
              min="1"
              max="3"
              value={outlineWidth}
              onChange={(e) => setOutlineWidth(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.78rem', minWidth: 22, textAlign: 'right' }}>{outlineWidth}</span>
          </div>
        )}
        {outlineMode === 'custom' && (
          <div className="upload-option">
            <label>颜色</label>
            <input
              type="color"
              value={outlineColor}
              onChange={(e) => setOutlineColor(e.target.value.toUpperCase())}
              className="compact-color-input"
            />
          </div>
        )}
      </div>

      {processing && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
