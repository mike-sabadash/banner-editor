# Bannermatic Figma Runtime Audit — 2026-09-13

## Evidence from the real user run

- Figma Desktop imported and opened `Bannermatic · Cloud Sync MVP2` after the distribution manifest was renamed to the standard `manifest.json`.
- The first pairing code expired during import; Cloud continued to display it as valid. A newly generated code connected successfully.
- The plugin displayed the same Cloud campaign, campaign ID, five required formats, five placements, Media Plan v1 and TT snapshot v0.
- Figma created/opened the required resize canvases and preserved them on repeat Cloud format reconciliation.
- The user changed a headline and Figma Motion easing in a source format.
- Selecting several formats and pressing the former `Sync missing formats` action produced a green success message but did not transfer either content or Motion. The message only reported missing-format reconciliation.
- The runtime reported six existing campaign canvases for five required formats. This must be surfaced as an extra canvas, not presented as six successfully synchronized required formats.

## Root causes

1. The Cloud-connected MVP2 plugin omitted the earlier semantic-slot granular sync engine.
2. One action named `Sync` combined a narrow missing-format operation with a broad user expectation.
3. The action ignored Figma selection but still displayed a green generic success status.
4. The current generated formats had semantic roles, but the MVP2 UI exposed no source, target scope or property selection.
5. Publication exported a static SVG and wrapped it in a generic animation instead of serializing actual Figma Motion keyframes and easing.
6. The current plugin entry point used `manifest-mvp2.json`, while `manifest.json` still launched the legacy plugin.
7. Cloud displayed an expired one-time code without a live expiry state.

## Implemented correction

- `manifest.json` is now the canonical Cloud MVP2 entry point; the previous all-in-one plugin is retained as `manifest-legacy.json`.
- Missing-format reconciliation is renamed `Add missing formats` and reports no-op, added and extra-canvas states truthfully.
- Reconciliation matches stable `formatId` before dimensions, avoiding a new duplicate when a known canvas has dimension drift.
- The user explicitly pins one selected source layer.
- Built-in semantic roles connect Headline, Copy, CTA, CTA background and Legal across formats.
- A newly added layer can receive a custom role and be cloned into formats where that role is missing.
- Target scope is explicit: all formats, same family or selected formats.
- Property scope is explicit: Content, Appearance, Motion, Timing, Easing and Layout/size.
- Unchecked properties are preserved. Layout remains local by default.
- Figma manual Motion tracks are written with `applyManualKeyframeTrack`; translation and scale deltas remain relative to each resize.
- Publish serializes top-level Figma layers into live HTML and transfers actual Motion keyframes, timing and cubic-bezier easing through Web Animations.
- Publication deduplicates canvases by stable Cloud `formatId`.

## Verification status

- Node syntax check: passed.
- Automated suite: 47 files / 193 tests passed.
- Runtime mock: headline content, relative translation Motion and custom cubic-bezier copied to two linked resize targets while target layout remained unchanged.
- Production build: passed.
- Real Figma Desktop verification of the corrected build: NOT YET VERIFIED.
- Push/PR: NOT YET COMPLETED in this scratch checkout.
- Production deployment: NOT PERFORMED.

## Exact real-runtime acceptance remaining

1. Import the corrected `figma-plugin/manifest.json` build.
2. Select the changed Headline in the master, set it as source, sync Content to all formats and confirm four target headlines update.
3. Select the animated image, assign/set its role, sync Motion + Timing + Easing to all formats and confirm the same motion/easing with resize-local positions.
4. Modify one target layout, repeat sync without Layout/size and confirm the manual geometry survives.
5. Pin a source, select only two target formats, use Selected scope and confirm only those two update.
6. Publish to Cloud and verify the same campaign receives a versioned live preview with the Figma animation.
7. Run Preflight and build/download the ZIP.
