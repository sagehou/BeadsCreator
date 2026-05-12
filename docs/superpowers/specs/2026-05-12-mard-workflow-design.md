# MARD Workflow Upgrade Design

Date: 2026-05-12

## Summary

Upgrade BeadsCreator from a hand-drawing bead board with basic image conversion into a MARD-first bead pattern workstation. This release focuses on image-to-bead conversion quality, complete MARD color matching, cleaner generated patterns, coordinate readability, randomized starter artwork, and ironing-effect previews.

## Confirmed Scope

This release includes:

- Replace mean RGB image conversion with dominant-color sampling per bead cell.
- Use MARD as the primary bead palette and organize color data in a reusable brand/palette model.
- Match source colors to MARD bead colors with a perceptual color distance.
- Add BFS-based speckle cleanup with a user-adjustable threshold.
- Replace the current fixed starter smiley with a randomly chosen emoji-style starter pattern.
- Add numeric coordinates to the bead canvas.
- Add ironing preview modes: normal iron, towel iron, fine glitter, and coarse glitter.
- Reorganize the UI into a workflow sidebar: image conversion settings, MARD palette, canvas, material list, preview, and export.

This release does not include:

- Project file save/open.
- WebDAV sync.
- Art text tools.
- Board-splitting workflows.
- Making-step exports.
- Full redesign into a standalone pattern-generator clone.
- Maintaining 11 bead brands in this iteration.

## Reference Inputs

- MARD color data source: https://www.pixel-beads.com/zh/mard-bead-color-chart
- Workflow and interface reference: https://www.pixel-beads.com/zh/perler-bead-pattern-generator
- Code reference checked locally: `C:\tmp\pindou-reference`

The MARD page is the source of truth for MARD color codes and hex values. If automated extraction is unstable, the implementation will use a checked-in static data file derived from that page and clearly mark the source and generation path in code comments.

## UI Design

Use the approved "workflow sidebar" direction.

Left sidebar:

- Image conversion section:
  - Upload or drag image.
  - Conversion method, defaulting to dominant color.
  - Maximum colors.
  - BFS cleanup threshold.
  - Edge enhancement only if it remains useful after dominant sampling.
- Palette section:
  - MARD selected by default.
  - Color swatches with code, hex, and optional name/category.
  - Search or filter by code/name when the palette is large.

Center canvas:

- Keep the current editable grid as the primary work surface.
- Show numeric coordinates for every cell when practical.
- Adapt coordinate text size and opacity at dense zoom levels.
- Add a display mode for bead view versus ironing preview.
- Keep existing editing tools: pencil, eraser, bucket, eyedropper, undo, redo, symmetry, zoom, and pan.

Right panel:

- Use tabs or segmented controls for:
  - Material list.
  - Ironing preview settings.
  - Export.
- Material list should use the active palette metadata, especially MARD code and color.
- Export should continue supporting PNG and CSV in this release.

## Data Model

Color records use one shape across the app:

```js
{
  id: 'MARD:A1',
  brand: 'MARD',
  code: 'A1',
  name: 'A1',
  hex: '#202020',
  rgb: [32, 32, 32],
  category: 'solid'
}
```

`name` can fall back to `code` when the source page does not provide a reliable localized color name. `category` is optional and should only be added when it can be derived reliably from the source grouping.

The app should not store only hex values in converted grids long term if palette metadata is needed. A practical transition is allowed:

- Keep grid cells as hex strings for compatibility with existing components.
- Add palette lookup helpers that map active hex values back to MARD records.
- Avoid a full grid schema migration in this release unless implementation shows it is simpler than adapter code.

## Image Conversion

The current worker pipeline uses K-Means and maps averaged/resized pixels to palette colors. This causes dark borders and light interiors to average into gray or muddy colors.

New conversion flow:

1. Decode the uploaded image on the main thread as today.
2. Send original image data, source size, target grid size, active palette, max colors, and cleanup threshold to the worker.
3. For each target bead cell, sample the corresponding source-image rectangle.
4. Quantize pixels in that rectangle into small RGB buckets and choose the most frequent bucket as the dominant source color.
5. Optionally run global color reduction if `maxColors` is enabled, but do not reintroduce mean-color averaging for each cell.
6. Match each dominant source color to the nearest enabled MARD color.
7. Run optional BFS cleanup on the matched grid.
8. Return a grid compatible with the current app state.

Transparent pixels:

- Ignore pixels below an alpha threshold.
- Composite partially transparent pixels over white before sampling.
- If a cell has no usable pixels, return an empty cell.

## Color Matching

Use a perceptual weighted RGB distance similar to the reference project's matching strategy:

- Weight green differences more strongly.
- Adjust red and blue weight based on average red.
- For neutral source colors, prefer neutral candidate colors when possible.

Disabled colors are not in scope for this release, but the matching helper should accept an optional disabled-id set so the future feature can be added without rewriting the matcher.

## BFS Cleanup

Cleanup runs on the converted grid:

1. Identify connected regions by exact matched palette color using BFS.
2. For each small region, inspect neighboring regions.
3. Merge the region into the best neighbor when:
   - the region size is below the user threshold, or
   - the color distance to a neighbor is below the similarity threshold.
4. Prefer the neighbor with the closest color distance; use larger region size as a tiebreaker.
5. Leave large isolated intentional detail intact.

Threshold behavior:

- `0` means disabled.
- Low values remove only single-cell noise.
- Higher values produce cleaner but less detailed patterns.

## Starter Patterns

Replace the fixed smiley with a deterministic set of emoji-style starter templates selected randomly at startup. Templates should be generated as normal grids, not images, so the user can edit them immediately.

Acceptable starter examples:

- Heart.
- Star.
- Flower.
- Cat face.
- Rainbow.
- Smiley replacement with better styling.

Each template must fit the default grid size and use active MARD-compatible colors.

## Coordinate Rendering

The canvas must show a numeric marker for every cell. The renderer should remain readable enough at typical zoom levels and avoid making dense canvases unusable.

Rules:

- Use short row/column labels inside or near cells.
- At low zoom, reduce opacity and font size rather than hiding all coordinates.
- Keep pointer interactions unaffected by coordinate overlays.
- PNG export may include coordinates only if the current visible mode is coordinate-enabled; otherwise export bead artwork as before.

## Ironing Preview

Ironing previews are visual-only render modes. They must not mutate the grid.

Modes:

- Bead view: current round bead rendering.
- Normal iron: flattened circles, softened holes, slight blending.
- Towel iron: matte texture, lower contrast, softer edges.
- Fine glitter: subtle fine highlight specks.
- Coarse glitter: fewer larger reflective specks.

The preview should be rendered from the same grid data and palette records used by the editor and material list.

## Error Handling

- If MARD data import fails at development time, fall back to the checked-in static color list.
- If an uploaded file is not an image, ignore it and show a concise UI error.
- If image conversion worker errors, stop the progress state and keep the existing grid unchanged.
- If a palette is empty, conversion should fail gracefully with a visible message instead of throwing in the UI.
- If cleanup threshold is invalid, clamp it to the supported range.

## Testing

Add focused tests for extracted non-React logic:

- Hex/RGB conversion and palette record validation.
- Perceptual color matching chooses expected MARD colors.
- Neutral source colors prefer neutral MARD candidates when available.
- Dominant-color sampling keeps a dark edge dominant when it occupies the most pixels in a region.
- Dominant-color sampling does not average black and white into gray for border-heavy regions.
- BFS cleanup merges small noisy regions into the best neighbor.
- BFS cleanup does not merge large intentional regions.
- Starter templates produce valid rectangular grids.
- Ironing preview helpers do not mutate grid data.

Verification commands:

- `npm run lint`
- `npm run build`
- Core algorithm test command added during implementation
- Browser smoke test for app load, MARD palette visibility, conversion controls, and preview mode switching

## Migration Notes

The current app has no Git metadata in `D:\Git\github\BeadsCreator`, so design and code commits cannot be created from this workspace unless a repository is initialized or the project is opened from its Git root.

Current UI text appears valid in UTF-8 when read via Node, but PowerShell displays some Chinese text as mojibake. Implementation should preserve UTF-8 source files and avoid rewriting unrelated text.

## Acceptance Criteria

- The app defaults to MARD-first color matching.
- Uploaded images convert using dominant cell colors, reducing gray/muddy border artifacts.
- Users can adjust cleanup strength and see cleaner patterns.
- Every canvas cell has coordinate information visible in the editor.
- Startup shows one of several better emoji-style starter patterns.
- Users can switch among bead view and four ironing preview modes.
- Material list and exports continue to work.
- Build and lint pass after implementation.
