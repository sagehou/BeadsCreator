export default function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  symmetry,
  onToggleSymmetry,
  showGrid,
  onToggleGrid
}) {
  const tools = [
    { id: 'pencil', icon: '✎', label: '画笔' },
    { id: 'eraser', icon: '⌫', label: '橡皮' },
    { id: 'bucket', icon: '▣', label: '油漆桶' },
    { id: 'eyedropper', icon: '⌖', label: '吸管' },
    { id: 'text', icon: 'T', label: '文字' },
    { id: 'select', icon: '□', label: '框选' },
  ];

  return (
    <div className="toolbar">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      <div className="toolbar-divider" />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.35 }}
      >
        ↶
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z)"
        style={{ opacity: canRedo ? 1 : 0.35 }}
      >
        ↷
      </button>

      <div className="toolbar-divider" />

      <button
        className={`tool-btn ${symmetry ? 'active' : ''}`}
        onClick={onToggleSymmetry}
        title="垂直对称"
      >
        ◐
      </button>

      <button
        className={`tool-btn ${showGrid ? 'active' : ''}`}
        onClick={onToggleGrid}
        title="网格线"
      >
        #
      </button>
    </div>
  );
}
