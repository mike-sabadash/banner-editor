# Bannermatic — Current Development Checkpoint

Updated: 2026-09-13 (UTC)

This file is the canonical resume point for a new Codex session. Read it before changing code. The exact remote branch head and the live deployment must still be verified at session start because this document is committed together with the code it describes.

## Working line

- Repository: mike-sabadash/banner-editor
- Branch: codex/mvp2-figma-cloud-runtime
- Pull request: https://github.com/mike-sabadash/banner-editor/pull/44
- Draft production: https://ads.rechord.online/
- Auto-deploy: every push to the branch; GitHub Actions concurrency serializes deployments
- Product model: Campaign → Media Plan → Content → Creative → Preflight → Delivery
- Sources of truth: Cloud owns campaign meaning/data/status; Figma is the Creative Provider

## Current milestone

Phase B / Product UX: Media Plan production grid and Content Matrix are complete and deployed.

The grid is being upgraded from a passive five-column list to an operational campaign-production view with:

- platform grouping;
- search and creative-state filtering;
- TT, ZIP and duration requirements;
- content assignment counts;
- real creative state and version links into the Creative workspace;
- responsive column controls and campaign/version summary.

Content is now a two-panel workspace with a compact language/completeness variant list, one selected-variant inspector and a placement × variant assignment matrix. It preserves ContentVariant and placement.contentVariantIds as the persistence contract.

## Completed before this milestone

- End-to-end production vertical slice: media plan normalization, content variants, Template/Figma providers, deterministic compliance, versioned nested HTML5 ZIP delivery.
- Representative XLSX acceptance: 10 placements, 5 sizes, 2 TT profiles, 4 content variants, 10 nested packages.
- Public draft acceptance and persistence checks.
- P0 viewport scrolling fix deployed and public asset verified.
- Media Plan visual references inspected and extracted into the Notion UX/UI audit.

## Guardrails

- Do not start a new resize/adaptation engine before the Creative Adaptation Research Gate and 25-case visual benchmark are complete.
- Preserve placement provenance, independent TT/delivery contexts and creative versions on media-plan re-import.
- Do not claim authenticated browser acceptance or Figma desktop runtime acceptance until each has been executed.
- Do not store secrets in this file or Notion.
- banners.rechord.online is outside this deployment path and must not be changed.

## Verification baseline

- Tests after this milestone: 45 files / 185 tests passed.
- Production build after this milestone: passed.
- Figma plugin syntax check: passed.
- Public /healthz: green.
- Deployed code commit: 15539f9203235967e0ae6cffeeb210943d42ffd8.
- PR check: Plugin final checks run 34750378777 / #238, success.
- Public production bundle: /assets/index-K4hZ7UvD.js; the new TT & limits grid marker is present.
- Content Matrix deployed code: 760bba9f51e9831bb3e0028b5622a95536996fa9.
- Content Matrix PR check: Plugin final checks run 34750690547 / #240, success.
- Current public bundle: /assets/index-ViA8Xv4j.js; the Content assignment matrix marker is present.
- Authenticated responsive visual acceptance: not yet verified (credentials are not available in the browser session).
- Real Figma desktop runtime: not yet verified.

## Product-owner correction: integration before UI polish

The previous order over-prioritized Cloud table presentation while the core Browser ↔ Figma journey was still not visibly proven. Media Plan and Content Matrix remain valid completed work, but Campaign Wall polish is no longer the next priority.

The user must not be asked to trust code, CI or written claims. Every core milestone must end with a version the user can run and a short self-test scenario. If the user cannot personally continue the journey in the product, the capability is not accepted.

## Ecosystem rule

Bannermatic must feel like one continuous ecosystem, not two unrelated products.

The required mental and interaction model is:

1. The user creates a Campaign in the browser.
2. The browser clearly explains why Figma is the next step and offers one dominant Continue in Figma action.
3. The Figma plugin opens/claims the same Campaign without asking the user to reconstruct campaign context.
4. The plugin visibly shows the same campaign name, required formats, Media Plan/TT context and current progress.
5. The user continues the same task: receives required formats, creates only missing formats, edits the Master, adapts/syncs formats and publishes Creative.
6. The browser receives the published result and continues the same Campaign through Campaign Wall → Preflight → Delivery.

Both sides must use consistent campaign identity, terminology, statuses, next actions and onboarding. Handoff state must be explicit: Not connected → Ready to continue in Figma → Connected → Formats created → Changes unpublished → Published → Returned to Cloud.

The Browser is the Campaign Control Center and source of truth for campaign meaning, Media Plan, TT, status and delivery. Figma is the Creative Workspace/Provider. This ownership boundary must be understandable from the interface without developer explanation.

## Revised priority order

1. P0 — Real Browser → Figma pairing and campaign continuation.
2. P0 — Current resize/adaptation baseline on real formats.
3. P0 — Real Figma → Cloud publication, previews, Preflight and ZIP.
4. P0/P1 — Creative Adaptation Research Gate and 25-case benchmark before any new resize engine.
5. P1 — Campaign Wall, Overview and operational Preflight based on real runtime data.
6. P2 — Campaign index, Settings, navigation, responsive/i18n and visual polish.
7. Release hardening and final customer-visible acceptance.

## Exactly one next task

Run and fix the Real Figma Runtime Acceptance + Resize Baseline so the user can start a campaign in the browser, continue that exact campaign in the plugin and see an obvious single-product handoff.

Definition of Done:

1. A real browser campaign produces a clear Continue in Figma handoff with no hidden developer data.
2. The real Figma Desktop plugin claims that campaign and displays its identity, required formats and TT/progress context.
3. Only missing formats are created; existing formats and manual overrides survive repeat sync.
4. The current baseline is visibly tested on 300×250, 300×600, 728×90, 320×50 and 1200×628 without claiming that rough output is production-quality.
5. Content and supported motion sync are tested; failures and limitations are recorded honestly.
6. Publish Creative returns a versioned result to the same browser campaign; Cloud preview, Preflight and production ZIP are verified.
7. The user receives the exact plugin build/location and a short no-terminal test scenario. CI alone does not satisfy acceptance.

## Implementation progress — visible handoff slice

Session 2026-09-13 added the first observable Browser ↔ Figma continuity slice:

- Cloud exposes campaign-scoped Figma handoff state: `not_connected → ready_to_continue → connected → published`.
- Creative workspace shows one dominant `Continue in Figma` action, the same campaign name, placement/format counts and a three-step Browser → Figma → Cloud journey.
- The Figma plugin shows the same campaign ID/name, Media Plan/TT versions, placement count and exact required-format list.
- Plugin actions now say `Sync missing formats` and `Publish to Cloud`; repeat-sync copy explicitly states that existing layers/manual changes are preserved.
- Automated evidence: 46 test files / 190 tests passed; production build passed; `node --check figma-plugin/mvp2-sync-code.js` passed.

Status remains deliberately incomplete:

- `CODED`: yes for this visible handoff slice.
- `TESTED`: yes, automated only.
- `DEPLOYED`: not yet recorded at the time of this checkpoint edit.
- `BROWSER RUNTIME VERIFIED`: no on this new slice.
- `FIGMA RUNTIME VERIFIED`: no.

## Runtime audit and creative-sync correction — 2026-09-13

The user completed the real Browser → Figma pairing and saw the same campaign in Figma. The run then proved that the Cloud-connected MVP2 plugin had no user-facing content/Motion sync: selecting formats and pressing `Sync missing formats` only returned a misleading green missing-format status.

The correction is coded on local branch `codex/figma-creative-sync-runtime`:

- explicit source layer pinning;
- semantic/custom layer roles;
- All / Same family / Selected target scopes;
- Content / Appearance / Motion / Timing / Easing / Layout-size property scopes;
- relative Motion transfer through the Figma manual keyframe API;
- local layout preserved by default;
- truthful missing-format/no-op/extra-canvas reporting;
- stable-format-ID reconciliation and publication deduplication;
- live HTML publication containing Figma keyframes and cubic-bezier easing;
- canonical `figma-plugin/manifest.json` for the current Cloud plugin, with the former build retained as `manifest-legacy.json`.

Evidence: `node --check figma-plugin/mvp2-sync-code.js` passed; 47 test files / 193 tests passed; production build passed. The runtime mock copied headline text, relative translation Motion and custom cubic-bezier easing while preserving target layout.

Status: CODED and AUTOMATED TESTED. NOT PUSHED, NOT DEPLOYED, and the corrected build is NOT YET FIGMA VERIFIED.

Exactly one next task: package the corrected three-file plugin, import it through `figma-plugin/manifest.json`, and execute the seven-step runtime acceptance in `docs/FIGMA_RUNTIME_AUDIT_2026-09-13.md`. Do not begin the new adaptation engine before this acceptance passes.
