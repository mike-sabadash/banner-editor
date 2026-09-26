# Resize runtime audit — 2026-09-14

Status: targeted regression corrections; NOT product acceptance.

## Baseline

Repository: mike-sabadash/banner-editor. Actual production branch is codex/mvp2-figma-cloud-runtime, baseline commit b010cd1b180cf630dd6c0ca94c276b77018693af. The canonical manifest loads mvp12-sync-code.js / mvp12-sync-ui.html. main and open PRs #47/#48 are not the production baseline.

## Confirmed source failures and corrections in this branch

- Role fallback searched all descendants and could bind a source to another group's headline. Matching now uses direct children, node type, and unclaimed source IDs.
- Legacy cleanup deleted nodes merely because their name/semantic role matched. It now records duplicate-link warnings without deleting artwork.
- Deep clones linked only their root, so a later nested sync cloned their existing descendants again. Every cloned descendant now gets its source ID.
- Nested changes solved on a temporary strip were not recursively committed. Recursive commit now updates corresponding children in place.
- fitTextBox/fitTextBinary replaced the incoming leading with hardcoded ratios. They now preserve pixel leading proportion, percentage leading and AUTO. Font-family changes propagate with font loading.
- Existing-node sync bound motion before layout; cloned nested nodes did not get the same rebinding. The final recursive motion pass runs after layout and any accepted AI correction.
- An explicitly empty selected-format list meant all formats. It now means no formats.
- The UI drew generic blocks under “What the plugin will build”. It now offers actual PNG snapshots exported from each campaign format, explicitly labelled static and refreshable.
- Strip failure details were returned but not displayed. They are now included in the update result.

These corrections do not establish motion-intent fidelity or arbitrary composition intelligence.

## Remaining product blockers

1. Rectangle/Vertical/Strip layout functions still impose a few fixed role-based arrangements; unknown/nested composition is not generally solved.
2. Designer layout overrides are not protected by a three-way property merge.
3. placeHeroCover grows a node beyond the media zone but does not construct the corresponding local clipping container.
4. Tiny-strip logic may hide copy/media without a campaign-level optional-content contract.
5. layoutScore ignores nested layers, treats some intentional overlaps as failures, and does not measure composition quality.
6. AI is a bounded second pass, so it cannot repair a fundamentally inappropriate first-pass structure.
7. publish() exports SVG and empty variantRenders in MVP12; faithful animated HTML5 and content-variant publication remain unresolved.
8. Missing-font, mixed-range typography, Auto Layout and animation-style behaviour require real Figma acceptance.
9. Some invalid-strip commit cases can partially change a real target. A complete transactional patch with rollback must be proven before general release.

## Research inspected this session

- Bannerflow scaling/versioning: https://www.bannerflow.com/features/ad-versioning
  The vendor explicitly describes preserving layout intent, focal points, safe areas and copy balance, plus master templates and bulk edits. This is product evidence, not access to its algorithm.
- Bannerflow small creatives: https://support.bannerflow.com/en/articles/13759652-tips-tricks-working-with-smaller-creatives
- Flexlio author description: https://forum.figma.com/showcase-your-work-14/i-built-flexlio-to-stop-rebuilding-the-same-campaign-in-endless-sizes-57740
  Relevant Figma campaign-resizing benchmark; not a verified drop-in engine and no source reuse performed.
- Tela source: https://github.com/heyimjames/tela
  Public project describes constraints, nested Auto Layout, shared text measurement and optional AI relayout. It is a candidate for algorithm comparison, not evidence that it reproduces the user's animated campaign. No code copied.
- Figma TextNode API: https://developers.figma.com/docs/plugins/api/TextNode/
  Supports native width/height text resizing and pixel/percentage/AUTO typography through documented node properties.
- Existing project research contract was recovered from PR #45: docs/FIGMA_CREATIVE_WORKSPACE_SPEC.md. Its 5 masters × 5 sizes benchmark has no retrieved completed results.

## Next acceptance evidence needed

Obtain the real campaign Figma file link and inspect its Master and target frames. No exact file key/node IDs or completed visual benchmark were found in available project context. Do not substitute unrelated lottery designs or synthetic diagrams.

Preserve the baseline; exercise actual Master → 300×250, 300×600, 728×90, 320×50, 1200×628 → manual target correction → repeat sync → motion playback → publish → Cloud reload → Preflight → ZIP. Score composition, copy, crop, required elements and correction effort. Exported screenshots are static evidence only.

This branch is a focused correction to the existing runtime, not a replacement resize engine. The research gate and real Figma acceptance remain open. No production deployment or paid model calls were performed in this session.
