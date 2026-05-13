# Editor Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve image import simplification, add import outlines, and add text insertion plus rectangular selection dragging.

**Architecture:** Keep destructive grid edits as pure functions under `src/lib` and keep React components responsible for interaction only. Image outline runs after worker conversion so the generated bead grid can be outlined consistently. Text and selection tools write final rasterized cells into the existing undo history.

**Tech Stack:** React 19, Vite worker modules, Node test runner, CSS grid canvas.

---

### Task 1: Grid Effects

**Files:**
- Create: `src/lib/gridEffects.js`
- Test: `tests/gridEffects.test.js`
- Modify: `src/workers/kmeansWorker.js`
- Modify: `src/lib/imageConversionRequest.js`
- Modify: `src/components/ImageConverter.jsx`

- [x] Add tests for outlining only the perimeter of filled regions, auto black/white outline selection, and custom outline colors.
- [x] Implement `applyOutlineToGrid(grid, options)` and `chooseAutoOutlineColor(grid)`.
- [x] Pass `outlineMode`, `outlineColor`, and `outlineWidth` through image conversion requests.
- [x] Apply outline after cleanup in the modern worker path.

### Task 2: Text Rasterizing

**Files:**
- Create: `src/lib/textRasterizer.js`
- Test: `tests/textRasterizer.test.js`
- Modify: `src/App.jsx`
- Modify: `src/components/Toolbar.jsx`
- Modify: `src/components/BeadCanvas.jsx`
- Modify: `src/index.css`

- [x] Add tests for rasterizing simple text into a grid and stamping text at a requested origin.
- [x] Implement a small 5x7 bitmap font for uppercase Latin letters, digits, and common punctuation.
- [x] Add a text tool and a compact floating editor with text, size, color, and confirm/cancel controls.
- [x] Stamp confirmed text into history as normal grid cells.

### Task 3: Selection And Dragging

**Files:**
- Create: `src/lib/selectionGrid.js`
- Test: `tests/selectionGrid.test.js`
- Modify: `src/App.jsx`
- Modify: `src/components/Toolbar.jsx`
- Modify: `src/components/BeadCanvas.jsx`
- Modify: `src/index.css`

- [x] Add tests for normalizing a drag rectangle, cutting selection content, and moving it to a new origin.
- [x] Implement pure helpers for rectangle normalization, extraction, clearing, and stamping.
- [x] Add select tool drag-to-select and drag-selection-to-move behavior.
- [x] Commit moved selection into undo history on mouse release.

### Task 4: Verification

**Files:**
- Existing tests and UI only.

- [x] Run `npm run lint`.
- [x] Run `node --test tests/*.test.js`.
- [x] Run `npm run build`.
- [x] Use Playwright against `http://127.0.0.1:5173/BeadsCreator/` to import with outline, add text, and move a selection.
