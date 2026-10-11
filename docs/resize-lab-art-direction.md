# Layout-aware image rollout for every scene

## Observed issue and hypothesis

On the supplied 2026-10-11 screenshots, scene 1 fits the horizontal strip and puts the square subject on the right. Scene 2 clips the character in the strip and places detailed valuables behind the square subline. These two different inputs do not establish the amount of stochastic variation.

Both flows already shared the Image API, model setting and family prompt. However, the gateway ignored composition, overlay text values and real overlay geometry. A 728×90 strip requested 21:9 and then used browser cover cropping.

**ЕСТЬ СЕЙЧАС → ДОЛЖНО БЫТЬ → ЧТО ИЗМЕНИТЬ:** general family guidance with browser cropping → one layout-aware pipeline across Design and scenes → measure occupied overlay boxes, pass them into shared art direction, request the nearest supported aspect ratio by actual dimensions, describe the final surviving window, and prepare exact output dimensions.

## Implementation and scope

- Measure the static banner DOM, using its real fonts, wrapping, visibility, image aspect ratios, family settings and per-format offsets. Four pixels of clearance are included. Scene layers are measured through the same `frameLayer` renderer used by previews and exports. Hidden layers are omitted.
- Both Design and scene rollout send normalized overlay zones to the same gateway. Full original source images remain authoritative; preview crops are never input references.
- The shared prompt makes measured zones authoritative over generic family directions, keeps them quiet, and asks for the complete focal group—including hands, faces, products and source valuables—to remain unobstructed. It does not draw the overlay content into the image.
- Select aspect ratio by target dimensions. Examples: 728×90 → 8:1, 970×250 → 4:1, 300×250 → 5:4. Explain the centered surviving window for sizes without an exact provider ratio.
- Normalize a successful output to exact banner pixels with proportional center-cover resampling, without stretching. This performs the crop described to the model instead of an additional implicit browser crop at default transforms. Existing manual transforms remain intact.
- Reject outputs differing by more than 12% from both requested and target aspect ratios. Pixel rounding and an already exact target ratio are allowed. Preserve previous images, show the error, and retain the provider's reported cost. There are no automatic additional paid calls.
- Keep the existing edit-only prompt for local AI editing; do not introduce unsolicited whole-scene recomposition there.
- No project/schema migration, typography/layout changes, animation or export changes. Existing generated images are not regenerated automatically. The new flow applies to subsequent rollout requests.

## Validation limits

Unit tests exercise request equivalence for different sources, normalized zone validation, panoramic ratios and generation windows, exact raster output size, aspect mismatch rejection, and cost accounting with one mocked provider call. Existing browser suites additionally assert Design/scene zone payloads, inherited offsets, hidden strip subline exclusion, and scene headline/CTA coordinates against visible DOM geometry.

These checks validate the mechanics, not semantic quality of an actual provider-generated composition. No real paid generations were executed for this change. The prompt's instruction to inspect object overlap is guidance to the generator; there is no independent vision-based object collision detector or guaranteed semantic quality score.

## Primary references

- OpenRouter Image API, normalized aspect ratios and provider clamping: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
- Google Gemini image generation, 3.1 Flash Image support for 1:4, 1:8, 4:1 and 8:1: https://ai.google.dev/gemini-api/docs/image-generation
