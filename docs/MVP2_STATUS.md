# Bannermatic MVP2 — implementation status

This file maps actual implementation evidence to `docs/MVP2_CHECKLIST.md`. It does **not** replace the checklist. Checklist boxes remain unchecked until the applicable runtime acceptance is verified.

Last updated: 2026-09-05

## Current branch / PR
- Branch: `codex/mvp2-figma-cloud-runtime`
- PR: `#44`
- Latest exact green head recorded before the current manual-setup commits: `c9153691c0350f1eb8826bfe35be68c548efba82`, CI `#153` success.
- Current manual-setup head is newer and remains TESTED only after its exact CI completes successfully.
- Deployment to `ads.rechord.online`: **NOT VERIFIED for the current head**.
- Cloud runtime acceptance: **NOT VERIFIED for the current head**.
- Figma runtime acceptance: **NOT VERIFIED**.

## P0 — public entry / SaaS product shell

### Marketing → auth → authenticated SaaS
- DESIGNED: yes.
- CODED: yes — `MarketingHome.tsx`, `AuthPage.tsx`, `BannermaticProduct.tsx`, `main.tsx`.
- TESTED: yes for the last green head; current head awaits exact CI.
- DEPLOYED: no verified current build.
- CLOUD RUNTIME VERIFIED: no.

### Premium design system
- DESIGNED: yes.
- CODED: substantial — `design-system.css`, `design-enforcement.css`, marketing/auth/cloud/workspace styles and modular screen styles.
- TESTED: static design-system contracts + production build on prior green heads.
- UX/UI RUNTIME AUDIT: not yet complete.
- Remaining: browser-level desktop/tablet/mobile audit and cleanup after exact build is deployed.

### RU / EN
- Architecture and locale persistence: coded.
- Marketing/auth/core shell have RU/EN coverage.
- Some campaign technical vocabulary intentionally remains English; full copy audit remains.
- Runtime language journey: not verified.

### Authentication / workspace / roles
- Server-backed register/login/me/logout and persistent scrypt-hashed accounts: coded/tested.
- Workspace membership roles Owner/Admin/Designer/Producer/Viewer: coded/tested foundation.
- Settings/member role UI: coded.
- Invitation flow for a new external member: not implemented.
- Production-domain auth/session runtime: not verified.

## P0 — Campaign Compiler

### Canonical model / dedupe
- Campaign → placements → unique visual formats → TT is coded.
- Equal-size dedupe while preserving placement relationships is coded/tested.

### Media Plan workspace
- Real import is coded through existing delivery-plan parser.
- `MediaPlanWorkspace.tsx` performs review-before-apply.
- Re-import diff exposes added/removed/changed placements and required-format changes.
- Existing creative is preserved for sizes that remain required.
- Media Plan version increments only after confirmed apply.
- Tests/build: passing on prior green head; current exact head awaits CI.
- Real browser upload against deployed current build: not verified.

### Manual campaign setup
- DESIGNED: yes.
- CODED: yes — `ManualCampaignSetup.tsx` is a first-class `Manual setup` mode inside the same `MediaPlanWorkspace`.
- Uses the exact same `Placement[]`, `compileVisualFormats`, `preserveVisualsForPlan`, `diffMediaPlan`, and `api.updateCampaign` flow as imported media plans.
- Supports arbitrary platform, placement, width and height rows plus add/remove placement.
- Equal dimensions deduplicate into one visual format while retaining independent placements.
- Review-before-compile is required before applying changes.
- TESTED: static feature test added; exact current-head CI pending at this status update.
- CLOUD RUNTIME VERIFIED: no.

## P0 — Figma ↔ Cloud

### Cloud specification / publish contract
- `figmaSpecFromCampaign` and Creative Publish contract: coded/tested.
- Creative versions are stored by the server after publish.
- Campaign/media-plan/TT ownership is preserved on Cloud side.

### Secure customer pairing — current slice
- Cloud can issue a six-digit, ten-minute, one-use Figma pairing code scoped to a specific campaign.
- The plugin claims the code and receives a scoped plugin session rather than the user's Cloud session token/password.
- Plugin sessions are scoped to campaign/workspace/user/role and stored server-side.
- Cloud Creative screen exposes `Connect Figma` through `FigmaConnectPanel.tsx`.
- Additive development plugin files:
  - `figma-plugin/mvp2-sync-code.js`
  - `figma-plugin/mvp2-sync-ui.html`
  - `figma-plugin/manifest-mvp2.json`
- Plugin stores only the scoped token in `figma.clientStorage`.
- Plugin fetches `/api/figma/campaign` and creates only missing required sizes for the paired campaign.
- Existing matching campaign formats are preserved and receive updated Cloud metadata.
- Plugin publishes through `/api/figma/creative-publish`.
- Contract/static tests: passing through CI #153 before the current manual-setup commits.
- FIGMA RUNTIME VERIFIED: **no**. The additive manifest exists specifically to allow safe runtime verification without replacing `ui-v14/code-v8` prematurely.

### Still missing in Figma ↔ Cloud acceptance
- Real Figma runtime pairing test.
- Runtime proof that re-sync never overwrites an edited existing creative.
- Production preview representation from Figma to Campaign Wall.
- Final integration of verified sync behavior into the main Bannermatic plugin UX.

## P0 — Campaign Wall
- Modular `CampaignWall.tsx` is part of the primary product shell.
- Creative / Delivery views: coded.
- Multiple placements per visual creative: coded.
- Play All / Pause All / Replay All + shared playhead UI/controller: coded.
- Published `previewUrl` iframe support: coded.
- Placeholder is explicitly labelled when no real published preview exists.
- Real Figma-produced HTML previews: still missing; therefore live-playback acceptance is NOT complete.
- Responsive runtime audit: not verified.

## P1 — TT Intelligence / Compliance / Delivery
- TT matching/resolution API and provenance foundation: coded.
- `DeliveryWorkspace.tsx` reads TT resolution + placement compliance.
- Placement compliance includes current dimensions/duration/ZIP/click/tracking foundation checks where data exists.
- Campaign readiness N/N UI: coded.
- Creative version history and version pins: coded foundation.
- Campaign Build persistence/history and manifest download: coded foundation.
- Full placement-specific binary/HTML delivery packages: not implemented.
- Safe-zone/required-element production validation: incomplete.
- Runtime verification: not done.

## Deployment blocker
A GitHub Actions deployment workflow exists for `ads.rechord.online`, but current automated deploy attempts stop at the explicit `BANNERMATIC_SERVER_SSH_KEY` secret check because that repository secret is not configured. No current tool session contains the server private key. Therefore **DEPLOYED remains no**; CI or repository changes must not be reported as visible website updates until this is resolved and the exact head is checked on the public domain.

## Next implementation order
1. Wait only for exact-head CI gates while continuing development; fix failures immediately.
2. Integrate a real creative preview payload from Figma into Cloud Campaign Wall.
3. Verify secure pairing in actual Figma via the additive MVP2 manifest; preserve existing plugin fallback.
4. Finish missing Live Compliance rules and real placement-specific Delivery Build output.
5. Complete workspace invitation/access customer journey.
6. Resolve deployment credential path, deploy exact tested head to `ads.rechord.online`, then perform browser UX/UI + responsive + RU/EN audit.
7. Integrate verified Figma sync into the primary plugin and perform final Figma runtime acceptance.
8. Run fresh-user end-to-end acceptance from public homepage through final Campaign Build.
