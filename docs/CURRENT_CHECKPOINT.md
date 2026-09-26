# Bannermatic — Current Development Checkpoint

Updated: 2026-09-13 (UTC)

This file is the canonical resume point for a new Codex session. Read it before changing code. The exact remote branch head and the live deployment must still be verified at session start because this document is committed together with the code it describes.

## Working line

- Repository: mike-sabadash/banner-editor
- Production branch: codex/mvp2-figma-cloud-runtime
- Current review branch: codex/campaign-lifecycle-figma-mvp12
- Current stacked base: codex/figma-creative-sync-runtime (PR #46)
- Pull request for this slice: https://github.com/mike-sabadash/banner-editor/pull/50
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

## Campaign lifecycle + Creative Workspace MVP12 — 2026-09-13

User evidence exposed four coupled failures: campaigns appeared to vanish, rename/delete did not exist, Cloud hid newly issued pairing codes when an older plugin session was still active, and the plugin's resize UX mixed missing-format sync with Master propagation.

Implemented on `codex/campaign-lifecycle-figma-mvp12` without production deployment:

- campaign list request failures preserve the last visible list and show a retry action instead of being treated as logout;
- campaign cards have inline rename and explicit confirmed deletion;
- deletion removes the campaign, pending pairing codes, active plugin sessions, creative-version history and build history;
- Cloud can issue and visibly display a fresh one-time code even while an older Figma session remains connected;
- issuing a replacement code invalidates only the previous unused code, not active plugin sessions;
- the user-attached MVP12 controller/UI are now retained as versioned source and are the canonical `manifest.json` runtime;
- plugin UI has an obvious `Switch campaign` action and working target-format selection;
- Master layers receive stable unique semantic slots; new nested layers and multiple images are reconciled by `masterSourceId` instead of name-only deduplication;
- deterministic Rectangle / Vertical / Strip layout and text fitting run before optional AI review;
- AI review is explicit in the UI, authenticated with the same campaign-scoped plugin token, routed through `ads.rechord.online`, bounded to small deltas and rolled back if the layout score becomes worse;
- the plugin no longer needs the separate `banners.rechord.online` domain.

Evidence at this checkpoint: 48 test files / 201 tests passed; production build passed; plugin controller and UI scripts parse; HTTP lifecycle covers new pairing, authenticated AI review, rename, persistence reload and deletion.

Honest status:

- `CODED`: yes.
- `AUTOMATED TESTED`: yes.
- `PUSHED / PR`: yes — draft PR #50; GitHub `Plugin final checks` run #247 passed.
- `DEPLOYED`: no.
- `REAL FIGMA VERIFIED`: no. The user-attached MVP12 was exercised before these corrections, but this exact canonical build has not yet been imported and run.
- `CAMPAIGN DISAPPEARANCE ROOT CAUSE`: the UI error path is fixed. Server data currently remains file-backed under `/var/www/banner-editor/runtime`; migration to an explicitly managed/backup data directory requires a separately approved production-data migration and is still a release-hardening item.

Exactly one next task after review/deployment approval: import the packaged canonical MVP12 through `figma-plugin/manifest.json` and execute one fresh Campaign Browser → Figma → Master edit (long text + two new images + motion) → five resizes → repeat update → Publish → Cloud reload → Preflight → ZIP acceptance. Record per-format failures; do not call the adaptation engine production-quality until that run passes.

## Latest authoritative state — production deployment 2026-09-13

This section supersedes earlier `NOT DEPLOYED` statements in this document.

- PR #50 was retargeted directly to `codex/mvp2-figma-cloud-runtime`, marked ready and merged.
- Production code commit: `584eb76a29babd30b8249f384c83d78ea82e9469`.
- Deploy workflow run: `34784743513`, completed successfully.
- Independent public verification: `/healthz` returned `ok`; the production entry returned HTTP 200; `/assets/index-CPHu4AwH.js` contains the new `New code`, `Refresh` and `Delete campaign` UI markers.
- PR #46 is closed as superseded because its commits are included in PR #50's merge.
- Automated baseline: 48 test files / 201 tests passed; production build and plugin syntax checks passed.
- Packaged plugin build used for real acceptance: `bannermatic-figma-mvp12-87f3806.zip`; import its `manifest.json`.
- Honest remaining status: the exact deployed Cloud lifecycle and exact packaged plugin still require one user-run Figma Desktop end-to-end acceptance. Do not call responsive adaptation production-quality before that run.

Exactly one next task: run a fresh Browser Campaign → new pairing code → Switch campaign in Figma → Master edit with long text, two new images and motion → propagate to all five formats → repeat sync → Publish to Cloud → reload → Preflight → ZIP. Record every incorrect format and fix against this evidence before adding broader polish.
