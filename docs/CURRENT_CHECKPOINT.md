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

Phase B / Product UX: Media Plan production data grid is complete and deployed.

The grid is being upgraded from a passive five-column list to an operational campaign-production view with:

- platform grouping;
- search and creative-state filtering;
- TT, ZIP and duration requirements;
- content assignment counts;
- real creative state and version links into the Creative workspace;
- responsive column controls and campaign/version summary.

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
- Authenticated responsive visual acceptance: not yet verified (credentials are not available in the browser session).
- Real Figma desktop runtime: not yet verified.

## Exactly one next task

Build the Content Matrix + inspector as the next Phase B product-UX slice while preserving the existing content-variant and per-placement assignment contract.

Definition of Done:

1. Inspect the already verified Content Workspace references and record an explicit Reference Extraction before implementation.
2. Replace the current card-per-placement checkbox layout with a dense matrix and a contextual variant inspector.
3. Preserve ContentVariant fields, placement.contentVariantIds and stale-content fingerprint behavior.
4. Cover assignment/editing behavior with tests and pass the full suite plus production build.
5. Deploy, verify the public build, then update this checkpoint, Notion and PR #44.
