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
| 0 | Foundation & migration safety | TODO | NOT RUN |
| 1 | Technical Requirements + @1x/@2x | TODO | NOT RUN |
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
- Current phase: **Phase 0**
- Current item: **0.1**
- Last completed item: **none**
- Last verified implementation commit: **none**
- Tests at checkpoint: **not run**
- Known blockers: **none**
- Production state: untouched by this initiative.

## NEXT ACTION
Start Phase 0. Before code changes inspect current production architecture and branch diff, then implement item 0.1 `FIGMA_ASSET_BRIDGE` feature flag without altering current behavior.

## Decision log
- 2026-09-24 — Persistent recovery mechanism created before implementation starts.
- 2026-09-24 — Repository status/checklist + Notion spec are canonical; chat memory is not.
- 2026-09-24 — Work proceeds sequentially through 14 phases, with Gate verification after every phase.
