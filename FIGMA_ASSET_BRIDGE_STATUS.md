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
| 2 | Asset Quality / Density Engine | TODO | NOT RUN |
| 3 | Figma Connection | TODO | NOT RUN |
| 4 | Figma Browser + Frame Detection | TODO | NOT RUN |
| 5 | Figma Layer Normalization | TODO | NOT RUN |
| 6 | Semantic Layer Mapper | TODO | NOT RUN |
| 7 | Import Plan | TODO | NOT RUN |
| 8 | Apply Import | TODO | NOT RUN |
| 9 | Responsive Masters handoff | TODO | NOT RUN |
| 10 | Update from Figma | TODO | NOT RUN |
| 11 | Export Optimizer | TODO | NOT RUN |
| 12 | AI Director integration | TODO | NOT RUN |
| 13 | Security & production hardening | TODO | NOT RUN |
| 14 | Full E2E / Release | TODO | NOT RUN |

## Current checkpoint
- Current phase: **Phase 2**
- Current item: **2.1**
- Last completed item: **Gate 1**
- Last verified implementation commit: **f06025dcef908fd5499c6913c48bd3d0551de5e8**
- Tests at checkpoint: **GitHub Actions run 35985519836 PASS on final Phase 1 checkpoint — full test suite PASS; TypeScript/Vite build PASS; server syntax/deploy script checks PASS**
- Known blockers: **none**
- Production state: untouched by this initiative.

## NEXT ACTION
Start Phase 2 at item 2.1. Re-read this status + canonical checklist, inspect current branch HEAD/diff, then implement Asset Quality / Density Engine without changing visual object size.

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
