# Bannermatic MVP2 — implementation status

This file records evidence/state only. `docs/MVP2_CHECKLIST.md` remains the acceptance contract; no checklist item is DONE until its applicable deployed/runtime chain passes.

Last updated: 2026-09-06

## Current branch / PR
- Branch: `codex/mvp2-figma-cloud-runtime`
- PR: `#44`
- Current implementation head before this status commit: `24ddc088c0ef52054571017ac10d5d906daa9a4e`.
- Exact-head verify check for `24ddc088...`: **success**.
- Automated deployment for the same head: **failure at deploy credential gate**; customer domain was not updated.
- Therefore: `DEPLOYED: no`, `CLOUD RUNTIME VERIFIED: no`, `FIGMA RUNTIME VERIFIED: no`, `DONE: no`.

## Customer path implemented in code
- Premium marketing → auth → workspace/campaign SaaS shell exists.
- Server-backed register/login/session/logout exists.
- Workspace roles Owner/Admin/Designer/Producer/Viewer exist.
- Workspace invitation creation + one-time invitation acceptance UX now exists in code.
- Campaign list/create/overview/settings navigation exists.
- Media Plan import and Manual setup share one placement model.
- Re-import diff/review preserves existing creative for unchanged sizes.
- Campaign Compiler deduplicates equal dimensions into unique visual formats while preserving placement relationships.

## Figma ↔ Cloud
- Six-digit one-use campaign pairing flow exists.
- Scoped plugin session exists; no user password/session token is copied into Figma.
- Additive MVP2 plugin creates only missing formats and preserves matching existing creative.
- Creative Publish can send SVG fallback plus self-contained HTML preview representation.
- Cloud creative version snapshots persist published preview payloads.
- Campaign Wall can render live HTML preview when published, Figma SVG snapshot as explicit non-live fallback, and synchronized Play/Pause/Replay/shared playhead for live previews.
- Actual Figma runtime verification is still required before acceptance.

## TT Intelligence
- Verified TT Knowledge matching is deterministic by platform + placement + size.
- Unknown remains Unknown; ambiguous matches are explicit.
- Provenance/checked-at fields are part of effective matched requirements.
- Client/imported TT remains campaign-owned and can override public knowledge in the campaign model.
- Remaining product gap: premium Cloud editing/override/diff-confirmation workflow for effective TT updates.

## Live Compliance
- Placement-level dimensions, published creative, ZIP estimate, duration, clickTag/click URL, tracking/impression URL and TT source checks exist.
- Safe-zone and required-element checks now run when TT defines those requirements; missing publish evidence stays Unknown rather than fabricated.
- Failed creative checks expose explicit Open-in-Figma fix intent; campaign-owned tracking gaps expose campaign-setting fix intent.
- Campaign readiness N/N exists.
- Runtime verification remains required.

## Versions / Delivery
- Creative versions are immutable snapshots in the creative-version store.
- Media Plan version increments on confirmed plan application.
- Campaign Build pins Creative + Media Plan + TT snapshot versions.
- Campaign Build now contains placement-specific HTML5 `index.html` output using the shared visual creative with per-placement click and impression URLs.
- Build tests prove two placements can reuse one visual format while receiving different delivery wrappers.
- Build remains blocked when compliance has warning/blocked placements.
- Remaining delivery gaps: downloadable package/ZIP UX rather than JSON manifest only, required PNG/JPG/GIF/MP4 paths where applicable, platform-specific preflight/export rules, runtime verification.

## Deployment blocker
Automated deployment still cannot reach `ads.rechord.online` because the GitHub Actions deployment job has no usable `BANNERMATIC_SERVER_SSH_KEY`. This blocks DEPLOYED/runtime states but must not stop independent development.

## Next implementation order
1. Finish premium Cloud TT effective-requirement editing, client override and explicit TT update diff/confirmation.
2. Turn Campaign Build placement files into real downloadable delivery packages and add format/output selection required by placement TT.
3. Improve Delivery/Compliance UX so every failed rule links to the exact corrective action.
4. Continue design-system, responsive, RU/EN and accessibility audit in code while deployment remains blocked.
5. When deploy access exists: deploy exact green head to `ads.rechord.online`, run fresh-user browser journey, fix runtime defects, then verify real Figma pairing/publish and finish final acceptance.
