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
