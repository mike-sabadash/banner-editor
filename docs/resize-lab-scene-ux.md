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
