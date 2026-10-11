# Scene editing references and implementation

The interface uses documented editing operations rather than exposing the internal `keep/change/hide` state machine.

| Operation | Official reference | Application in Resize Lab |
| --- | --- | --- |
| Select an object on canvas or in Layers | [Adobe Express Layers](https://helpx.adobe.com/uk/express/web/arrange-layers-and-pages/layers.html) | Six independently selectable existing layers; canvas selection retained. |
| Add/upload and replace an image directly | [Adobe Express Replace images](https://helpx.adobe.com/uk/express/web/add-images-and-visuals/images-and-backgrounds/replace-background.html) | Always available Add/Replace button; file upload automatically updates the scene image. |
| Select an object, open Animation, choose In/Out and effect | [Adobe Express Animate designs](https://helpx.adobe.com/uk/express/web/audio-and-animation/animate-design.html) | Contextual Animation panel, In/Out tabs, existing supported preset cards, playback preview; precise timing remains optional. |
| Visibility eye and independent layer animation | [The Brief/Creatopy Timeline](https://help.thebrief.ai/hc/en-us/articles/22637327611548-How-to-use-Timeline) | Eye toggles and independent layer effects. No unsupported Middle/custom animation controls are added. |
| Multiple pages and page duplication | [Adobe Express Add pages](https://helpx.adobe.com/uk/express/web/arrange-layers-and-pages/add-pages.html) | Existing scenes, thumbnail selection, duration, duplication and ordering remain. |

The Content/Animation organization adapts these documented operations to the existing Resize Lab panel. It is not a pixel-identical copy of another editor, and no claim of comparative usability testing is made.

## Scene-specific AI adaptation

This is the existing product's AI rollout operation applied to each scene background, not a claimed third-party UI pattern. Each background stores its own adaptation per format. Every request uses that scene's original image and decoded source dimensions, the selected target size, the existing composition/family direction and resolved scene copy.

Successful adaptations persist as project assets, are inherited by unchanged scenes, and are embedded as original data URLs in standalone HTML. Replacing a scene source clears its adaptations. Failed formats can be retried without regenerating successful ones. The base Design image, existing family settings and manual layout overrides are independent of scene backgrounds.

Testing uses mocked AI responses; no billable generation is run during automated verification.

## Playback and inspector regression corrections

- Preserve the banner DOM while the transport clock advances. Memoized HTML rendering separates the canvas from timer labels; scene selection follows the transport without restarting tracks.
- Server asset reconciliation returns the existing scene array when nothing changed. A save acknowledgement must not trigger another save or restart playback. When assets actually change during playback, rebuilt markup resumes at the current playhead.
- Effect selection previews only the selected layer via Web Animations on the current static scene; the transport button plays the full banner. Other objects remain visible. Effect cards include animated thumbnails and the canvas outlines the selected object.
- Format tools remain available in Animation. Per-format image replacement, AI edits, image transforms, logo width and text positions persist in the selected scene's format adaptation. Base Design and other scenes remain independent.
- [Adobe Express layer rearrangement](https://helpx.adobe.com/ca/express/web/arrange-layers-and-pages/layers.html) documents dragging layers up/down. The top-to-bottom panel mirrors actual canvas order; uploaded image layers enter at the top and retain the original filename. Legacy projects keep their previous stack until edited. Stack changes are represented in both preview and exported playback.
- The existing `src/web-scene/MotionInspector.tsx` Bézier editor is reused, with its editable handles, preset selector, grid and four numeric coordinates. In and Out curves are stored separately. The underlying renderer supports only the existing effects; no unsupported Spring/Bounce controls are shown. Ease meanings follow [The Brief documentation](https://help.thebrief.ai/hc/en-us/articles/22637711374108-How-to-use-Ease-and-Tween-types).
- Name and duration fields share an aligned compact row, with enough space for an unwrapped duration label.

Runtime acceptance checks cover visible text/CTA during real playback, persistent DOM across a scene boundary, synchronized scene selection, isolated effect preview, scene-specific format transforms/dragging/AI edit, layer reorder and filename persistence, custom easing reload, existing family editing, assets, auth/cost UI and standalone HTML. AI calls remain mocked.

## Unified scene master rollout
Each selected scene exposes Master → existing shared format picker → existing Smart rollout, independently of selected layer or content/motion tab. Uploading the scene master retains the complete source and invalidates only that scene's adaptations. Rollout sends that source at its real dimensions to the existing adaptation API, stores separate scene/format images, and retries only unfinished formats. Existing base adaptations are retained when adding missing formats to a scene based on the original design. Manual transforms do not mark an unadapted source ready. Generated or explicitly uploaded per-format images remain editable and survive reload/export. Format selection and optional AI instructions reuse the Design controls. Generation remains an explicit Smart rollout action, just as in Design.

## Contextual inspector audit (2026-10-11)

Observed separately in the supplied screens:
- 16:19:55: scene 2 selected; scene list, transport, metadata, master and rollout occupy the left column; selected-layer properties are outside the visible area; 728×90 crops the character.
- 16:24:56: scene 2 selected; the rollout action remains below scene/master/picker/instruction sections; the screenshot alone does not establish whether adaptation has run.
- 16:37:39: Design shows headline, subline and CTA fields together, followed by typography/logo/button/AI disclosures and format selection.
- 16:43:35: button styling is expanded above the long format list; the image does not show the mode tabs or current object selection.

Existing → expected → change:
- A mixed left form → navigation separate from object properties → left scenes/layers or formats, central canvas, right contextual inspector.
- All text fields together → one selected object's Character controls → selection on master, output canvas, or Layers swaps text/font/relative size/color; button appearance only appears for CTA.
- Rollout after expanding lists → launch remains discoverable → launch at the top of navigation, with selected scene scope; formats use their own tab.
- Ready results disable generation → explicit regeneration of the selected scene → Repeat rollout opens a native modal describing scope, replacement and provider charges; confirmation regenerates selected sizes from the full source while retaining overrides and other scenes.

Primary references:
- Figma Properties: https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar
- Figma text properties: https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties
- After Effects contextual Properties / Text sections: https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/animate-using-the-properties-panel/properties-panel.html

Only existing supported properties are exposed. Relative font size remains a percentage of the adaptive layout size. Text-layer styling is shared across scenes as in the existing project model; independent headline/subline/CTA fonts are preserved. No unsupported font weights, kerning, paragraph alignment, or new persistence model are claimed. Animation presets, the existing Bézier editor, per-format AI/manual editing, playback, save/reload and export remain available.
