import { EDITOR_TOOLS } from '../lib/toolConfig';

function ToolIcon({ name }) {
  switch (name) {
    case 'pencil':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l4.2-1 10.6-10.6-3.2-3.2L5 15.8 4 20z" />
          <path d="M14.8 6l3.2 3.2" />
        </svg>
      );
    case 'eraser':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.5 14.5l7.8-7.8a2 2 0 0 1 2.8 0l4.2 4.2a2 2 0 0 1 0 2.8l-5.8 5.8H8.2l-3.7-3.7a1 1 0 0 1 0-1.3z" />
          <path d="M10 19.5h10" />
          <path d="M9.6 9.4l5 5" />
        </svg>
      );
    case 'bucket':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5l6.8-6.8 7.2 7.2-6.8 6.8a2 2 0 0 1-2.8 0L5 15.3a2 2 0 0 1 0-2.8z" />
          <path d="M8.8 8.8l6.4 6.4" />
          <path d="M19 15.5c1.3 1.4 2 2.5 2 3.3a2 2 0 0 1-4 0c0-.8.7-1.9 2-3.3z" />
        </svg>
      );
    case 'eyedropper':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 4.8l4.7 4.7" />
          <path d="M9.2 18.8l-4 .8.8-4L16.7 5a2 2 0 0 1 2.8 2.8L9.2 18.8z" />
          <path d="M7 15.5l1.5 1.5" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6h12" />
          <path d="M12 6v12" />
          <path d="M9 18h6" />
        </svg>
      );
    case 'select':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 5h12v14H6z" strokeDasharray="3 2" />
          <path d="M15 15l4 4" />
        </svg>
      );
    case 'undo':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 8H5v4" />
          <path d="M5 8c2.7-2.8 7.6-3.4 10.8-1.2 3 2.1 3.8 6.2 1.7 9.2-1.2 1.7-3 2.7-5 2.9" />
        </svg>
      );
    case 'redo':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 8h4v4" />
          <path d="M19 8c-2.7-2.8-7.6-3.4-10.8-1.2-3 2.1-3.8 6.2-1.7 9.2 1.2 1.7 3 2.7 5 2.9" />
        </svg>
      );
    case 'symmetry':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16" />
          <path d="M5 8l4 4-4 4V8z" />
          <path d="M19 8l-4 4 4 4V8z" />
        </svg>
      );
    case 'mirror-horizontal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v16" />
          <path d="M4 7h5v10H4z" />
          <path d="M20 7h-5v10h5z" />
          <path d="M8 3l4 3-4 3" />
          <path d="M16 21l-4-3 4-3" />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5h14v14H5z" />
          <path d="M5 10h14" />
          <path d="M5 14h14" />
          <path d="M10 5v14" />
          <path d="M14 5v14" />
        </svg>
      );
    default:
      return null;
  }
}

function ToolbarButton({ active, disabled, label, icon, onClick }) {
  return (
    <button
      className={`tool-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <ToolIcon name={icon} />
    </button>
  );
}

export default function Toolbar({
  leadingContent,
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  symmetry,
  onToggleSymmetry,
  onMirrorHorizontal,
  showGrid,
  onToggleGrid
}) {
  return (
    <div className="toolbar">
      {leadingContent}
      {EDITOR_TOOLS.map((tool) => (
        <ToolbarButton
          key={tool.id}
          active={activeTool === tool.id}
          label={tool.label}
          icon={tool.icon}
          onClick={() => onToolChange(tool.id)}
        />
      ))}

      <div className="toolbar-divider" />

      <ToolbarButton
        disabled={!canUndo}
        label="撤销 (Ctrl+Z)"
        icon="undo"
        onClick={onUndo}
      />
      <ToolbarButton
        disabled={!canRedo}
        label="重做 (Ctrl+Shift+Z)"
        icon="redo"
        onClick={onRedo}
      />

      <div className="toolbar-divider" />

      <ToolbarButton
        active={symmetry}
        label="实时对称绘制"
        icon="symmetry"
        onClick={onToggleSymmetry}
      />
      <ToolbarButton
        label="左右镜像"
        icon="mirror-horizontal"
        onClick={onMirrorHorizontal}
      />
      <ToolbarButton
        active={showGrid}
        label="网格线"
        icon="grid"
        onClick={onToggleGrid}
      />
    </div>
  );
}
