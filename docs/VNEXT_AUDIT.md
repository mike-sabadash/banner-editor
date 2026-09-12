# Campaign Production System — vNext audit and first vertical slice

## Source reconciliation

Audited source: `codex/mvp2-figma-cloud-runtime`, PR #44, `c1198411042053230a046c665defa22539458a17`.
The 158 source blobs and tree `9de13c60016ea1d9d4a85c56a4450c50083706d2` were verified against GitHub. Original commit restored locally through Git objects because CLI clone has no credentials; source retrieval and publishing use the authenticated GitHub connector. Other local checkouts were not modified.

Product authority: Notion **Product architecture & IA vNext — 12 Sep 2026**, under Project HQ `3cdcd8b5343f8124b57eeafeb575f8de`. Read alongside MVP2 Cloud + Figma Architecture, Market research, Technical runbook and the 11 new vNext backlog items.

The Notion runbook still describes August PR #1. The repository's MVP2_STATUS is newer and describes PR #44. Neither is runtime evidence. The current user instruction supersedes old editor-first/Figma-only decisions: Template and Figma sources converge; deployment requires approval.

## Current-state audit / reuse plan

| Area | Classification | Evidence / action |
| --- | --- | --- |
| Auth, workspaces, campaign storage | reuse + harden | `server/mvp2Store.mjs`; file-backed persistence, not a transactional production database. |
| Campaign compiler | refactor | `src/mvp2/domain.ts`; groups by dimensions and preserves creative, but lacks concepts, content assignments and property metadata. |
| Media import | refactor | `src/campaign/deliveryPlan.ts`; real XLSX ZIP/XML decoding, but regex row inference loses column meaning, negative booleans, separate dimension columns and source identity. |
| AI extraction | reuse | `server/openrouterGateway.mjs`; real OpenRouter extraction exists. Not invoked without approved paid usage; do not call deterministic parsing AI. |
| Main Cloud UI | reuse | `BannermaticProduct`, `MediaPlanWorkspace`, `CampaignWall`, `DeliveryWorkspace`. Extend existing entry points. |
| Earlier Cloud shells / canvas editor | legacy | Existing fallback routes remain. No new parallel editor. |
| Figma runtime and bindings | reuse + refactor | Additive `manifest-mvp2.json` bridge and earlier slot-based motion tools remain. Real Figma runtime NOT VERIFIED. |
| Compliance | refactor | Server has rule checks; overview uses weaker client readiness, which can falsely report ready. Use one evaluator. |
| Builds / version store | reuse + refactor | Pins and HTML wrappers exist. Download is JSON, package bytes are not validated. Add real deterministic ZIP packaging. |
| Historical ui-v3…ui-v14 files | legacy | Retain until replacement is runtime verified; no deletions. |
| Metadata-only readiness | obsolete behavior | Replace claims based merely on source-label presence with actual preflight evidence. |

## Gap analysis

Missing end-to-end capabilities: meaningful normalized matrix review, content entities/assignment, family-specific template composition, stable semantic roles, property overrides that survive content edits, publish preview, truthful deliverable readiness, downloadable HTML5 packages. Full XLS/Google Sheets, arbitrary AI parsing, arbitrary Figma layout adaptation, advanced platform adapters, database hardening and Figma runtime verification remain broader milestones. They must not be silently treated as delivered by this slice.

## Canonical model

Extend the current Campaign, do not replace it:

- Campaign owns placements, content variants, concepts and families.
- Concept owns family-specific creative sources.
- Family classifies layout behavior; default classifier is replaceable.
- VisualFormat remains the shared visual size and source relationship used by Figma.
- Placement owns independent requirements, source provenance and explicit content variant IDs.
- Deliverable identity is `(placementId, contentVariantId)`; variants are expanded for production, not multiplied into permanent Figma frames.
- A template source has stable semantic roles and per-role/per-property overrides. Content changes invalidate the previous publish fingerprint; publication rebuilds linked properties while retaining overrides.
- A Build contains immutable generated placement files, version pins, measured archive size and the exact checks used to accept it.

## Technical architecture

Extend the existing browser parser and review UI. A shared production module defines template composition, source fingerprints and content expansion. Existing compliance and build services consume expanded deliverables; existing server campaign storage persists the same enriched Campaign. No second auth, campaign store, parser service or export UI.

Template Mode uses deterministic responsive compositions with semantic text roles, explicit required-content errors, fixed safe bounds, conservative text-fit checks and browser evidence. Unsupported output types or missing evidence block export rather than pretending to comply. Figma remains the freeform design path; template support does not assert arbitrary Figma import/export fidelity.

## UX/IA critical path

ЕСТЬ СЕЙЧАС → Cloud has Media Plan, Creative and Delivery workspaces in code.
ДОЛЖНО БЫТЬ → Campaign production can be completed without visiting a canvas for every variant.
ЧТО ИЗМЕНИТЬ → Extend those same workspaces with matrix review, Content, template publication and downloadable packages. Preserve existing visual tokens and dense operational layout.

- Campaign: inspect and correct imported placements and TT before applying.
- Content: edit copy variants and assign allowed combinations to placements.
- Creative: choose template source or Figma; inspect family previews, property overrides and publication impact.
- Delivery: see ready/total deliverables; inspect exceptions first; download ready builds.

## Implementation plan

1. Improve the existing XLSX/CSV normalization contract and expose row review without silent guesses.
2. Add optional content/concept/family/source fields to the current model and persistence.
3. Render several family-specific template formats with content assignments and local property overrides; explicit publish.
4. Share readiness evaluation and block outdated/unsupported/invalid outputs.
5. Generate actual ZIP packages with measured bytes, immutable files and version pins; extend existing download UI.
6. Run regression tests and actual browser journey, then publish to PR #44 and checkpoint Notion.

## Definition of Done for this slice

An actual XLSX workbook produces reviewable placement rows; two content variants across multiple sizes produce distinct deliverables; a format-level headline size override survives a content update; stale outputs cannot export; after publication preflight identifies an intentional exception; correction enables ZIP download; archives open and contain functioning, correctly sized HTML5 files with placement-specific click metadata. Refresh retains the campaign and builds. No claim of full product or Figma acceptance without corresponding runtime evidence.

## E2E scenario

Create a fresh local account/campaign. Upload an XLSX with 300×250, 300×600 and 728×90 placements, including two placements sharing 300×250 but different URLs. Inspect TT and correct an ambiguous value. Create RU and EN content and assign both. Select the typographic template, publish, inspect previews, set one headline font-size override, change shared text and verify outputs become outdated. Republish and verify override persists. Set a duration constraint below the motion duration; verify blocked export. Correct the requirement, publish/revalidate and download a campaign archive; unzip nested placement packages, inspect exact sizes, URLs, text and actual file weights. Reload and verify persistence. Figma pairing/motion regression remains a separately reported runtime gate.

## Baseline evidence

- 40 test files / 170 tests passed using retained installed dependencies.
- TypeScript build and Vite production build passed.
- Source tree clean before edits (dependency symlink excluded locally).
- CLI `npm ci --offline` was blocked by the execution environment; no lockfile was changed. Existing dependency directory used for baseline; clean install remains CI's gate.
- Deployment NOT performed. Cloud domain and Figma runtime NOT VERIFIED.

## Current implementation evidence — 12 Sep 2026

- The production vertical slice in this document is implemented in the working tree on `codex/mvp2-figma-cloud-runtime`.
- 43 test files / 181 tests pass, including a live HTTP integration test that registers a fresh workspace, creates a campaign, preserves two equal-size placement contexts, publishes two content variants from a template, verifies 4/4 preflight readiness, downloads and opens the campaign ZIP plus four nested placement packages, rejects an outdated build, restarts the API store and verifies campaign/build persistence.
- TypeScript and Vite production build pass.
- Cloud Browser could not load the local app because the browser client blocks local workspace addresses before page load. Therefore visual browser runtime is NOT VERIFIED.
- Figma runtime is NOT VERIFIED.
- Publishing the verified commit triggered the branch's pre-existing push workflow. GitHub Actions deployed exact remote head `0057494b043210bf591599dffc82e47cc467ba82` successfully to `ads.rechord.online` without a separate manual workflow dispatch. The public homepage, Sign in route and RU switch were then browser-verified; authenticated production and Figma journeys remain NOT VERIFIED.
- The product owner confirmed that the current server is a working draft environment, so branch auto-deploy remains enabled for this phase. A separate approval gate is still required before this environment has real users or valuable production data.

## Representative campaign and Figma content checkpoint — 12 Sep 2026

- A generated standards-compliant XLSX acceptance workbook now exercises 10 independent placements, 5 unique size classes, two TT profiles, distinct tracking rules and four content variants through parsing, campaign compilation, deterministic Template publication, compliance and 10 nested HTML5 ZIP packages.
- XLSX parsing no longer depends on browser-only `DOMParser`; its actual ZIP/XML path is covered in the Node test environment. Media-plan source and worksheet provenance now survives into Campaign and build metadata.
- The Figma Cloud specification now includes campaign Content Variants. The MVP2 plugin creates stable semantic roles for Headline, Copy, CTA and Legal, renders each Cloud variant from a temporary Figma clone, and publishes immutable per-variant HTML/SVG payloads.
- Figma publications now carry a content fingerprint. Content edits block delivery until Figma republishes; older metadata-only Figma publications cannot silently pass variant export.
- Automated evidence: 45 test files / 183 tests passed; TypeScript and Vite production build passed; `node --check figma-plugin/mvp2-sync-code.js` passed.
- Real Figma runtime is still **NOT VERIFIED**. The plugin behavior above is CODED and automated TESTED only until exercised inside the Figma desktop runtime.
