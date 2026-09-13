# Bannermatic — Current Development Checkpoint

Updated: 2026-09-13 (UTC)

This file is the canonical resume point for the next implementation session. Read it before changing product code. Recheck remote branch head, PR status and live runtime at session start; documentation is not runtime evidence.

## Working line

- Repository: `mike-sabadash/banner-editor`
- Implementation branch: `codex/mvp2-figma-cloud-runtime`
- Main implementation PR: #44 — https://github.com/mike-sabadash/banner-editor/pull/44
- Planning specification: `docs/FIGMA_CREATIVE_WORKSPACE_SPEC.md`
- Planning branch: `docs/figma-creative-workspace-spec-2026-09-13`
- Draft production: https://ads.rechord.online/
- Product flow: Campaign → Media Plan → Content → Creative → Preflight → Delivery
- Ownership: Cloud owns campaign meaning/Media Plan/TT/status/versions/delivery; Figma owns editable creative/master/layers/assets/layout/motion/manual overrides.

## Current evidence baseline

Existing implementation already contains a meaningful Cloud/Figma contract: scoped one-use campaign pairing, campaign spec, required formats, missing-format-only generation concept, semantic text roles, Content Variant publication, versioned creative snapshots, stale-content blocking, compliance and campaign ZIP generation.

Cloud production vertical-slice evidence exists from prior sessions, including same-dimension placements with independent delivery context. Media Plan production grid, Content Matrix and viewport-scroll work are already valid completed work and must not be rolled back.

However, acceptance remains deliberately split:

- `CODED`: substantial Cloud/Figma contract exists.
- `TESTED`: automated contract/build tests exist.
- `DEPLOYED`: draft environment has been deployed on prior verified heads; exact current head must be rechecked.
- `BROWSER RUNTIME VERIFIED`: some public Cloud routes/API journeys were previously verified, but the exact Browser → Figma handoff on current head is not accepted.
- `FIGMA RUNTIME VERIFIED`: **NO** for the real end-to-end MVP2 continuation flow.
- Adaptation/resize quality: **NOT ACCEPTED**; current output is a baseline only.

Do not collapse these statuses into `done`.

## Product-owner correction — integration before more UI polish

The Browser and Figma plugin must behave as one ecosystem. The user creates/reviews a Campaign in Cloud, sees one clear `Continue in Figma` action, continues the **same campaign** inside the plugin, publishes, then returns to the same Cloud Campaign for previews, Preflight and Delivery.

Do not make the user reconstruct context, copy hidden IDs or use terminal commands. Campaign name, required formats, TT/progress context and handoff state must be visible on both sides.

## Creative Workspace architecture guardrails

The new implementation contract is `docs/FIGMA_CREATIVE_WORKSPACE_SPEC.md`. It records evidence, competitive/open-source research, Browser↔Figma ownership, state machine, sync contract, manual-override preservation, benchmark and implementation milestones.

Mandatory rules:

- Do not build a new resize/adaptation engine before the Creative Adaptation Research Gate and 25-case benchmark.
- Current resize/generation must first be recorded honestly as a baseline on real formats.
- Use Figma-native Auto Layout/constraints/components/component properties/variables where they genuinely solve deterministic layout problems.
- Do not mistake responsive UI mechanics for arbitrary graphic composition.
- AI may propose bounded structured Delta operations after a deterministic Anchor; it may not freely generate absolute pixel geometry.
- Never silently overwrite manual overrides.
- Never conflate one Visual Format with one Placement: equal dimensions may serve several placements with independent TT, click/tracking and delivery contexts.
- Never call generated SVG/generic HTML wrapper motion equivalent to real Figma motion unless runtime evidence proves it.
- Unknown stays Unknown; no fake previews/statuses/readiness.

## Exactly one next implementation task

# Real Browser → Figma Runtime Acceptance + Resize Baseline

Do this before any new adaptation-engine work and before further broad UI polish.

### Required user-visible scenario

The product owner must be able to complete, without terminal:

1. Create/open a Campaign in browser.
2. Import/review Media Plan and reach one clear `Continue in Figma` action.
3. Open the exact Bannermatic plugin build in Figma Desktop.
4. Pair and see the same Campaign name/identity, required formats and TT/progress context.
5. Receive the required set and create/update **only missing formats**.
6. Repeat sync and prove existing creative/manual changes survive.
7. Run the **current baseline** on `300×250`, `300×600`, `728×90`, `320×50`, `1200×628`; save screenshots and limitations without calling rough output production-quality.
8. Test currently supported content and motion sync; record unsupported behavior honestly.
9. Publish Creative from real Figma runtime back to the same Campaign.
10. In Cloud, see the actual published Creative Version/preview, run Preflight and generate/download Campaign ZIP if compliance permits.

### Definition of Done

- Exact deployed browser URL supplied.
- Exact Figma plugin build/manifest or installable plugin reference supplied.
- Short no-terminal self-test supplied to the user.
- Same `campaignId` proven across Browser, plugin and publication.
- Existing format roots/manual edits survive repeat missing-format sync.
- Real Figma Desktop runtime executed; automated simulation does not count.
- Actual publication appears in Cloud and is used by Preflight/Build.
- Five-format current resize baseline captured and scored as baseline, not marketing claim.
- Any failure is recorded by exact status: CODED / TESTED / DEPLOYED / BROWSER RUNTIME VERIFIED / FIGMA RUNTIME VERIFIED.

### What does NOT satisfy this milestone

- green CI alone;
- `node --check`;
- source inspection;
- API-only Cloud acceptance;
- mock/generated preview without real Figma publish;
- placeholder format components;
- claiming resize quality without the benchmark.

## What comes immediately after

Only after the runtime milestone above:

1. Stable campaign binding/recovery.
2. Explicit semantic Master/slot mapping.
3. Three-way property-level partial sync with manual override preservation.
4. Figma-native deterministic Anchor benchmark.
5. Creative Adaptation Research Gate / 25-case comparison and `reuse / adapt / build` ADR.
6. AI-assisted bounded Delta only if benchmark evidence justifies it.
7. Publish contract v2 and release hardening.

## References

- `docs/FIGMA_CREATIVE_WORKSPACE_SPEC.md` — implementation contract for the Figma Creative Workspace.
- `docs/MVP2_CHECKLIST.md` — acceptance contract.
- `docs/VNEXT_AUDIT.md` — production vertical-slice evidence/history.
- `docs/MVP2_STATUS.md` — older evidence snapshot; do not treat as current if it conflicts with this checkpoint.
