# Figma Asset Bridge — Persistent Implementation Status

> CANONICAL CONTINUATION FILE. Read this file before any work on Figma Asset Bridge.
> Do not infer progress from chat memory. Verify this file against git history/diff before editing code.

## Canonical sources
- Product/technical specification: Notion page **Figma Asset Bridge — Technical Spec & Implementation Plan**
  https://app.notion.com/p/3e5cd8b5343f81719708c8a673086e2d
- Project HQ: Notion **Редактор баннеров — Project HQ**
  https://app.notion.com/p/3cdcd8b5343f8124b57eeafeb575f8de
- Repository: mike-sabadash/banner-editor
- Production branch: `codex/mvp2-figma-cloud-runtime`
- Implementation branch: `feature/figma-asset-bridge`
- Production must NOT be changed until final Phase 14 release unless explicitly requested.

## Continuation protocol — mandatory
At the beginning of EVERY continuation/session:
1. Read this file completely.
2. Read `docs/FIGMA_ASSET_BRIDGE_CHECKLIST.md`.
3. Read the Notion technical specification above if architectural context is needed.
4. Inspect current branch HEAD, recent history and changed files/diff.
5. Reconcile git reality with the checklist. Git wins over stale status text.
6. Resume from **NEXT ACTION** below. Do not restart completed phases.
7. Never mark a checkbox DONE without implementation + applicable tests.
8. At each Gate: run tests/build required by that phase; record evidence below.
9. After every meaningful checkpoint update BOTH this status file and the checklist in the same branch.
10. When a session stops mid-phase, record exact completed item IDs, current item, blockers, changed files, last verified commit, tests, and next command/action.

## Architecture invariants
- Figma is a controlled one-way Asset Bridge, NOT the old live/runtime Figma integration.
- After import, Bannermatic owns campaign state and imported binaries.
- Logical layout size != source asset resolution != export resolution.
- @2x is driven by Technical Requirements / Media Plan; AI Director may validate but must not invent it.
- Imported key layouts feed existing Family/Responsive Masters.
- Order: Human Figma Master → Family Master → Responsive inheritance → local override → AI Director → Verification → Export Optimizer.
- Update from Figma defaults to **assets only** and must preserve Bannermatic animation/timeline/local work.
- Do not silently flatten supported layer structures or silently delete layers.

## Phase ledger
| Phase | Name | State | Gate |
|---|---|---|---|
| 0 | Foundation & migration safety | DONE | PASS |
| 1 | Technical Requirements + @1x/@2x | DONE | PASS |
| 2 | Asset Quality / Density Engine | DONE | PASS |
| 3 | Figma Connection | DONE | PASS |
| 4 | Figma Browser + Frame Detection | DONE | PASS |
| 5 | Figma Layer Normalization | DONE | PASS |
| 6 | Semantic Layer Mapper | DONE | PASS |
| 7 | Import Plan | DONE | PASS |
| 8 | Apply Import | DONE | PASS |
| 9 | Responsive Masters handoff | DONE | PASS |
| 10 | Update from Figma | DONE | PASS |
| 11 | Export Optimizer | DONE | PASS |
| 12 | AI Director integration | TODO | NOT RUN |
| 13 | Security & production hardening | TODO | NOT RUN |
| 14 | Full E2E / Release | TODO | NOT RUN |

## Current checkpoint
- Current phase: **Phase 12**
- Current item: **12.1**
- Last completed item: **Gate 11**
- Last verified implementation commit: **ed3aeabe8f9405f5d610c75ee0bf6f5eb4498f56**
- Tests at checkpoint: **GitHub Actions run 35993659722 PASS — 72 test files / 317 tests; TypeScript/Vite build PASS; server syntax/deploy script checks PASS**
- Known blockers: **none**
- Production state: untouched by this initiative.

## NEXT ACTION
Start Phase 12 at item 12.1. Re-read this status + canonical checklist, inspect current branch HEAD/diff, then implement AI Director integration.

## Phase 11 evidence
- Export Optimizer derives physical output dimensions strictly as logical size × exportScale; @2x never changes editor canvas geometry.
- Validation computes per-layer required raster resolution and blocks insufficient source density before export.
- Export plan supports JPG, PNG, WebP and HTML5 requirements, preserves vector/logo representation and editable text representation, and assigns layer-aware compression priority (background aggressive, product/hero high fidelity).
- Raster optimizer contract performs resize-before-encode through a processor boundary and uses bounded quality candidates for JPG/WebP rather than unbounded loops.
- maxBytes is a hard validation target: impossible limits return blocking diagnostics and never silently degrade output below the bounded policy.
- Campaign endpoints `/export-validate` and `/export-optimized` expose diagnostics/physical targets for delivery integration.
- Gate 11 CI: run `35993659722` SUCCESS — 72 test files / 317 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 10 evidence
- Imported Family Masters now expose `Update from Figma`; update starts with a fresh Figma version lookup and node normalization before any mutation.
- Diff engine compares node IDs/fingerprints and classifies added, removed, asset-changed, geometry-changed, text-changed and unchanged layers; UI displays version, counts and changed-layer list.
- Default `Update assets only` replaces Bannermatic-owned materialized assets while preserving geometry, animation, timeline, semantic roles and local corrections.
- Explicit `Layout + assets` updates geometry/text/assets but still preserves Bannermatic animation/timeline and semantic role state.
- Missing Figma layers are never silently deleted; removed and newly added nodes are surfaced as conflicts and existing composition is kept until explicit import resolution.
- Every update returns a full pre-update creative-document checkpoint for Undo semantics.
- Gate 10 CI: run `35992918945` SUCCESS — 71 test files / 310 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 9 evidence
- Exact imported Figma formats are exposed as Family Master candidates on the Format Wall with explicit `CANDIDATE` / `MASTER` status and `Use as Family Master` actions.
- Promotion converts imported per-format snapshots into the existing `responsiveMasters` model; no parallel Figma inheritance system is created.
- Geometry classification covers portrait, tall, rectangle, wide, strip and micro-strip, including extreme strip formats.
- Master snapshots preserve imported semantic/provenance layer state and remove the source-format local override after promotion so the promoted source becomes the family authority.
- Existing local overrides on other formats are retained above family inheritance; intermediate AUTO rollout continues through the established Responsive Masters resolver.
- Batch promotion supports the intended 4–6 human key compositions and the Format Wall communicates Figma layouts → Family Masters → AUTO formats.
- Initial CI build exposed an async React effect typing issue; fixed and rerun successfully.
- Gate 9 CI: run `35992248448` SUCCESS — 70 test files / 306 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 8 evidence
- Apply Import now creates a full creative-document checkpoint before mutation and returns it for Undo semantics.
- Figma image/vector/fallback nodes are exported server-side, downloaded, and materialized into Bannermatic-owned runtime asset storage; persisted AssetSource records reference Bannermatic URLs, not Figma CDN URLs.
- Imported layers use stable frame+node IDs, semantic roles, asset references, Figma provenance and SHA-256 fingerprints; per-format import metadata stores frame fingerprints and node IDs.
- Exact selected frames are applied as format-specific Scene 01 overrides; original scene list, durations, existing layer animation/timeline and Responsive Masters remain untouched.
- Single-frame and multi-frame batch flows share the same transaction; tests cover five key compositions, full checkpoint Undo, and idempotent retry without duplicate layers.
- Import Plan CTA now executes Apply Import and reports imported layer/asset counts.
- Gate 8 CI: run `35991585683` SUCCESS — 69 test files / 301 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 7 evidence
- Added campaign-scoped read-only ImportPlan endpoint; it fetches selected Figma nodes, normalizes and semantically maps them, but performs no campaign mutation.
- Plan includes selected frames, exact target formats, layer counts, semantic-role breakdown, unknown layers, unsupported visual fallbacks, raster source-density warnings and mapping conflicts.
- Missing exact targets and duplicate selected frames targeting one campaign format are explicit conflicts; no nearest-format suggestion is silently applied.
- Import Plan UI previews each frame → target mapping plus role chips and diagnostics before any Apply step.
- Batch CTA is present as `Import N layouts into Scene 01` but deliberately disabled until Phase 8 Apply Import exists, preserving Phase 7 read-only semantics.
- Gate 7 CI: run `35991181402` SUCCESS — 68 test files / 297 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 6 evidence
- Deterministic semantic mapper normalizes layer names and maps background/product/logo/headline/cta/legal/decor aliases before any AI call.
- Weak names use node type, position and relative-size heuristics with explicit confidence; low-confidence and unknown layers form the ambiguity queue.
- OpenRouter semantic fallback receives only compact ambiguous-layer payloads (ID/name/type/kind/box/short text/current role), never the whole Figma document.
- AI results cannot overwrite high-confidence deterministic mappings or user corrections; role provenance is persisted as rule / ai / user with confidence.
- Semantic Role Review UI shows recognized/unknown counts, makes unknown layers visible, offers bounded AI resolution, and supports manual role correction persisted through semanticOverrides during normalized reads.
- Gate 6 CI: run `35990602857` SUCCESS — 67 test files / 293 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 5 evidence
- Added read-only Figma node-tree normalizer and authenticated `/normalize` bridge endpoint.
- TEXT becomes editable normalized text; IMAGE fills become raster asset descriptors; simple VECTOR nodes become SVG/vector asset descriptors; RECTANGLE and ELLIPSE become native shapes.
- Groups and nested frames retain hierarchy metadata while child layers are flattened into stable frame-relative logical geometry; Figma Auto Layout is recorded as metadata only and never becomes a runtime dependency.
- Masks, effects, non-normal blend modes, boolean/unsupported node types and unsupported containers become explicit visual-fallback records with source node IDs so later import can render/materialize them without silently dropping visuals.
- Normalized layers preserve z-order, opacity, rotation, crop/imageTransform and frame-relative percentage geometry.
- Gate 5 CI: run `35989040911` SUCCESS — 66 test files / 288 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 4 evidence
- Campaign Wall now has an isolated `Import design` entry point opening the new one-way Asset Bridge browser; legacy plugin/runtime remains excluded from the product shell.
- Source picker currently exposes Figma first, with server-only credential connection from Phase 3.
- Browser supports Figma project/team file discovery, file selection, page filtering, frame cards, actual frame dimensions and multi-select.
- Deterministic frame matcher prioritizes actual dimensions, uses names only as a secondary signal (`META_300x600_V1` supported), flags duplicate-size frames, and suggests nearest campaign format without auto-applying it.
- Mapping preview distinguishes EXACT / NAME MATCH / SUGGESTED and keeps nearest matches suggestion-only.
- Gate 4 CI: run `35987820916` SUCCESS — 65 test files / 284 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 3 evidence
- New server-only `figmaAssetBridge.mjs` wraps Figma REST; frontend never receives or stores the Figma credential.
- Credentials are encrypted with AES-256-GCM using server key material; status exposes metadata only.
- Authenticated integration endpoints provide status, connect/reconnect, validate, disconnect, file listing, file/page/frame retrieval, nodes, exports and versions.
- Revoked/expired credentials are rejected and removed from active credential state.
- Figma REST calls have timeout handling plus bounded retry/backoff for 429 and transient 5xx failures.
- Adapter tests cover connect/reconnect, encrypted/hidden credential behavior, disconnect/revocation, files/pages/frames/nodes/exports/versions, and rate-limit retry.
- Gate 3 CI: run `35987390762` SUCCESS — 64 test files / 280 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 2 evidence
- AssetSource raster dimensions drive deterministic effective density from source pixels / placed logical pixels.
- Canonical 400×600→200×300=2×, 300×450→200×300=1.5×, 200×300→200×300=1× cases covered by tests.
- Density is compared with format exportScale and classified OK / Warning / Insufficient.
- Density calculation is read-only: source resolution never changes masterBox, resolved layout, or visual object size.
- Selected image Asset Quality Inspector shows Source, Placed, Density and Required scale.
- Campaign Wall shows per-format quality warnings and a campaign-level insufficient-assets list.
- Gate 2 CI: run `35986375110` SUCCESS — 63 test files / 276 tests, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 1 evidence
- Per-format exportScale is normalized to @1x/@2x; default is @1x.
- Media Plan / TT can supply exportScale, exportType and max weight; compiled formats preserve strict requirements.
- Logical canvas dimensions remain unchanged; physicalExportSize computes export pixels independently (200×300 @2x → 400×600).
- Advanced manual scale override is explicit and marked MANUAL; recompilation preserves it.
- Campaign Wall and Media Plan show compact @Nx / weight / type badges; @2x summary filters affected formats.
- Scene Editor surfaces requirements without changing canvas geometry or Responsive Master inheritance.
- Gate 1 final CI: run `35985519836` SUCCESS on checkpoint commit; tests PASS, build PASS, server/deploy syntax checks PASS.
- Draft PR: #84. Production branch untouched.

## Phase 0 evidence
- Feature flag `FIGMA_ASSET_BRIDGE` is disabled by default.
- Additive `FormatSpec`, `AssetSource`, Figma provenance, semantic layer metadata and optional CreativeDocument assets added.
- Campaign format recompilation preserves optional bridge metadata.
- Responsive master snapshots preserve semantic/provenance metadata.
- Legacy creative documents remain valid because all new persisted fields are optional.
- Gate 0 CI: run `35984491751` SUCCESS, 63 test files / 269 tests, build PASS.
- Draft PR: #84. Production branch untouched.

## Decision log
- 2026-09-24 — Persistent recovery mechanism created before implementation starts.
- 2026-09-24 — Repository status/checklist + Notion spec are canonical; chat memory is not.
- 2026-09-24 — Work proceeds sequentially through 14 phases, with Gate verification after every phase.
