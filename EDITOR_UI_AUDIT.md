# Banner Editor UI audit

Audit scope: campaign navigation, Library, canvas, layers, properties, timeline, keyframes, playback, linked formats and export-facing state.

## Interaction model

| Area | Expected animation-editor pattern | Result |
|---|---|---|
| Workspace | Campaign is the parent context; a format opens as a focused document | Campaign hub is primary; editor has a clear back action |
| Timeline dock | Divider can be dragged; content scrolls when the dock is smaller than its rows | Implemented with persisted height, compact rows, sticky ruler and vertical overflow |
| Layer density | Layer rows prioritize scan density over large touch-card spacing | Reduced from 38 px to 28 px |
| Playback | Play/stop are visible; Space is contextual and does not collide with canvas pan | Corrected: timeline hover owns playback, canvas hover owns pan |
| Keyframes | Diamonds live on their layer, grouped by time; dragging changes time and respects snapping | Existing implementation conforms; selection and delete remain grouped |
| Layer range | In/out handles trim visibility without changing keyframe timing | Existing implementation conforms; handles remain available in compact rows |
| Library | Imported assets remain reusable and can be clicked or dragged onto the Stage | Corrected: ordinary project Library, click-to-place and drag-to-position |
| Canvas | Drop position is respected; selection, transform handles, zoom and Space-pan are direct manipulation | Drop coordinates and drag-over feedback added |
| Layers | Visibility and lock are independent from selection | Existing implementation conforms |
| Properties | Static values edit the object; animated values at a keyed time edit that keyframe | Existing implementation conforms |
| Easing | Easing belongs to the selected keyframe interval/group, not the entire timeline | Existing implementation conforms |
| Undo/redo | Destructive and transform operations are recoverable | Existing grouped history retained; duplicate Save action removed |
| Format links | Shared semantic content must not imply shared geometry or animation | Corrected with linked/local content instances |
| AI resize | Experimental generation must not be presented as deterministic production behavior | Removed from the primary format-editor toolbar |

## Linked object rules

Objects cloned between formats keep the same logical ID. Their behavior is split deliberately:

- Shared when linked: text value, asset reference, object name, font family, color and text case.
- Always local: position, size, scale, rotation, opacity, crop, visibility, in/out range, keyframes, easing, line height and text-box width.
- A format instance can switch to `Local to this format`; subsequent content changes remain local.

This means a headline, CTA, logo or product can be updated campaign-wide without forcing a wide and a vertical banner to share composition. Separate wide/tall artwork is created by making that instance local and replacing its asset.

## Verification criteria

- Timeline height remains between a usable collapsed minimum and available viewport height.
- When rows exceed the timeline dock, only the timeline grid scrolls; the ruler stays visible.
- Dropping an asset places its origin at the pointer position inside the Stage.
- Linked content updates all same-ID instances and does not change their geometry.
- Local content override does not modify the master or sibling formats.
