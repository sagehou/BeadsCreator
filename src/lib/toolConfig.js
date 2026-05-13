export const EDITOR_TOOLS = [
  { id: 'pencil', icon: 'pencil', label: '画笔' },
  { id: 'eraser', icon: 'eraser', label: '橡皮' },
  { id: 'bucket', icon: 'bucket', label: '油漆桶' },
  { id: 'eyedropper', icon: 'eyedropper', label: '吸管' },
  { id: 'text', icon: 'text', label: '文字' },
  { id: 'select', icon: 'select', label: '框选' }
];

const TOOL_IDS = new Set(EDITOR_TOOLS.map((tool) => tool.id));

export function toolCursorClass(toolId) {
  return TOOL_IDS.has(toolId) ? `cursor-${toolId}` : 'cursor-pencil';
}
