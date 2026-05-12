import { useState, useRef, useCallback } from 'react';
import { PERLER_COLORS, HAMA_COLORS } from '../data/colors';

export default function ImageConverter({ gridRows, gridCols, onConvert }) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enhanceEdges, setEnhanceEdges] = useState(false);
  const [maxColors, setMaxColors] = useState(16);
  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  const paletteColors = [...PERLER_COLORS, ...HAMA_COLORS];

  const processImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    setProcessing(true);
    setProgress(0);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Scale image to grid size
      const canvas = document.createElement('canvas');
      canvas.width = gridCols;
      canvas.height = gridRows;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, gridCols, gridRows);
      const imageData = ctx.getImageData(0, 0, gridCols, gridRows);
      URL.revokeObjectURL(url);

      // Create worker
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
          // Convert palette indices back to hex grid
          const newGrid = [];
          for (let y = 0; y < msg.height; y++) {
            const row = [];
            for (let x = 0; x < msg.width; x++) {
              const idx = msg.result[y * msg.width + x];
              row.push(paletteColors[idx].hex);
            }
            newGrid.push(row);
          }
          onConvert(newGrid);
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
        width: gridCols,
        height: gridRows,
        paletteHexColors: paletteColors.map(c => c.hex),
        maxColors: maxColors,
        enhanceEdges: enhanceEdges,
      });
    };

    img.src = url;
  }, [gridRows, gridCols, maxColors, enhanceEdges, onConvert, paletteColors]);

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
      <div className="palette-section-title">📷 图片转拼豆</div>

      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icon">🖼️</div>
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
          <label>最大色数:</label>
          <input
            type="range"
            min="4"
            max="24"
            value={maxColors}
            onChange={(e) => setMaxColors(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.78rem', minWidth: 22, textAlign: 'right' }}>{maxColors}</span>
        </div>

        <div className="upload-option">
          <label>轮廓增强:</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enhanceEdges}
              onChange={(e) => setEnhanceEdges(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
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
