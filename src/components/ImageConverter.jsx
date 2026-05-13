import { useState, useRef, useCallback } from 'react';
import { MARD_COLORS } from '../data/colors';

const paletteColors = MARD_COLORS;
const maxColors = 16;
const enhanceEdges = false;

export default function ImageConverter({ gridRows, gridCols, onConvert }) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cleanupThreshold, setCleanupThreshold] = useState(1);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

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

      if (workerRef.current) workerRef.current.terminate();

      const worker = new Worker(
        new URL('../workers/kmeansWorker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e) => {
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
        } else if (msg.type === 'error') {
          console.error('Worker error:', msg.error);
          setProcessing(false);
          worker.terminate();
        }
      };

      worker.postMessage({
        imageData: imageData.data,
        sourceWidth: imageData.width,
        sourceHeight: imageData.height,
        width: gridCols,
        height: gridRows,
        paletteColors,
        maxColors,
        cleanupThreshold,
        bucketSize: 16,
        enhanceEdges,
      });
    };

    img.src = url;
  }, [gridRows, gridCols, cleanupThreshold, onConvert]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processImage(file);
  }, [processImage]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    processImage(file);
  }, [processImage]);

  return (
    <div style={{ padding: '0 2px' }}>
      <div className="palette-section-title">图片转拼豆</div>

      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">图片</div>
        <div>点击或拖拽上传图片</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div className="upload-options">
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
      </div>

      {processing && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
