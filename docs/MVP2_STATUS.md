# Bannermatic MVP2 — implementation status

This file maps actual implementation evidence to `docs/MVP2_CHECKLIST.md`. It does **not** replace the checklist. Checklist boxes remain unchecked until runtime acceptance is verified.

Last updated: 2026-09-05

## Current branch / PR
- Branch: `codex/bannermatic-mvp2`
- PR: `#43`
- Production deployment: **NOT VERIFIED for MVP2**
- Production runtime acceptance: **NOT VERIFIED**

## P0 — product shell and foundations

### Premium SaaS shell
- DESIGNED: yes
- CODED: yes — `src/mvp2/CloudAppV2.tsx`, `src/mvp2/cloud.css`
- TESTED: yes — production build is covered by PR CI
- RUNTIME VERIFIED: no

### Design system foundation
- DESIGNED: yes
- CODED: partial — shared CSS tokens/components exist in `src/mvp2/cloud.css`
- TESTED: build only
- RUNTIME VERIFIED: no
- Remaining: formal token contract + systematic responsive/interaction audit across every screen.

### RU / EN architecture
- DESIGNED: yes
- CODED: yes — `src/mvp2/i18n.ts` and locale switching
- TESTED: build
- RUNTIME VERIFIED: no
- Remaining: full copy coverage; several MVP2 strings are still English literals.

### Real authentication / persistent sessions
- DESIGNED: yes
- CODED: yes — `server/mvp2Store.mjs`, `server/mvp2Api.mjs`, `src/mvp2/api.ts`, `CloudAppV2`
- TESTED: yes — store tests + CI build/server checks
- RUNTIME VERIFIED: no
- Notes: server is authoritative; password hashes use scrypt; session tokens persist in the server store. Production-domain auth is not yet proven.

### Roles / access
- DESIGNED: yes — Owner/Admin/Designer/Producer/Viewer capability matrix exists.
- CODED: partial — client capability matrix and server membership roles exist.
- TESTED: partial — store permission tests exist.
- RUNTIME VERIFIED: no
- Remaining: complete server/client permission parity and member-management UI/invitation flow.

### Campaign list / create campaign
- DESIGNED: yes
- CODED: yes — server persistence + CloudAppV2 UI
- TESTED: yes — store tests + build
- RUNTIME VERIFIED: no

## P0 — Campaign Compiler

### Canonical domain model
- DESIGNED: yes
- CODED: yes — `src/mvp2/domain.ts`
- TESTED: yes — `src/mvp2/domain.test.ts`
- RUNTIME VERIFIED: no

### Equal-size deduplication / placement preservation
- DESIGNED: yes
- CODED: yes — `compileVisualFormats`
- TESTED: yes
- RUNTIME VERIFIED: no

### Media Plan import
- DESIGNED: yes
- CODED: partial — existing parser handles XLSX/CSV/TSV/TXT/DOCX and sends unsupported docs toward AI extraction; CloudAppV2 persists normalized placements/formats.
- TESTED: yes for parser/model/build
- RUNTIME VERIFIED: no with a real production upload
- Remaining: PDF/AI production path, richer platform/placement extraction and review-before-apply.

### Re-import diff
- DESIGNED: yes
- CODED: foundation — `src/mvp2/planDiff.ts`
- TESTED: yes — `src/mvp2/planDiff.test.ts`
- RUNTIME VERIFIED: no
- Remaining: integrate diff review/confirmation into Cloud import UI before applying campaign update.

### Manual campaign setup
- DESIGNED: yes
- CODED: not yet in Cloud MVP2
- TESTED: no
- RUNTIME VERIFIED: no

### Review screen: TT coverage/conflicts/Unknown
- DESIGNED: yes
- CODED: partial — overview/delivery views show readiness and Unknown, but no complete pre-compile conflict review yet.
- TESTED: build
- RUNTIME VERIFIED: no

## P0 — Figma ↔ Cloud
- Stable campaign ID: cloud campaign IDs exist; plugin connection not yet completed.
- Required format contract: domain model exists; plugin fetch/connection not yet completed.
- Create only missing formats: existing plugin logic supports missing-format creation locally, but cloud contract runtime is not connected.
- Publish Creative → cloud version: **not implemented end-to-end**. Current Cloud metadata publish is explicitly a placeholder and must not be called production sync.
- Cloud preview update from Figma: not implemented.
- Deep-link/open workflow: cloud routes to creative editor with campaign ID, but real Figma plugin handoff/runtime is not verified.

## P0 — Campaign Wall
- Creative/Delivery modes: CODED
- Multiple placements per one creative card: CODED
- Play/Pause/Replay controls: CODED as UI preview behavior
- Real HTML live previews: NOT IMPLEMENTED
- Shared synchronized playhead: NOT IMPLEMENTED
- Responsive runtime audit: NOT VERIFIED

## P1 — TT Intelligence
Existing TT Knowledge server APIs exist from MVP1. Cloud integration is partial; current library screen still contains seed placeholders. Do not call TT Library complete until it reads/writes real knowledge records and supports campaign-effective TT with provenance.

## P1 — Live Compliance
Only readiness foundation exists. Real ZIP/duration/clickTag/tracking/safe-zone validation against published creative builds is not implemented yet.

## P1 — versions
Campaign records already contain `creativeVersion`, `mediaPlanVersion`, and `ttSnapshotVersion` foundation fields. Immutable published Creative versions, media-plan snapshots, TT snapshots and reproducible Campaign Builds are not implemented yet.

## P1 — delivery
Not implemented end-to-end. Existing legacy export capability is not equivalent to a placement-specific Campaign Build.

## Latest verified CI evidence
- CI #75: success after switching main Cloud entry point to server-backed `CloudAppV2`.
- CI #77: success after adding media-plan diff and creative-preservation tests.

## Next implementation order
1. Integrate media-plan diff review/apply into Cloud.
2. Complete manual setup using the exact same campaign domain model.
3. Build Figma ↔ Cloud campaign connection and required-format contract.
4. Publish real creative preview/version from Figma to Cloud.
5. Replace Campaign Wall mock cards with live preview builds + shared playhead.
6. Connect real TT Knowledge into Cloud and effective TT resolution.
7. Build Live Compliance.
8. Add immutable version snapshots and Campaign Build.
9. Complete placement-specific delivery/export.
10. Deploy and run the full production acceptance scenario.
