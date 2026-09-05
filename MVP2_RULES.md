# Bannermatic MVP2 — Development Rules

This file is the persistent operating contract for MVP2 development. It supplements `AGENTS.md`, `docs/MVP2_CHECKLIST.md`, and `docs/MVP2_STATUS.md` and must be read before any substantial MVP2 change or after any session/context interruption.

## 0. Non-negotiable definition of the product

**MVP2 means a complete customer-facing SaaS product, not a collection of backend foundations, isolated screens, mocks, tests, plugin utilities, or internal admin tooling.**

The pilot product name is **Bannermatic**.

A user must be able to enter Bannermatic from the public website and complete the whole journey without developer intervention:

`Marketing site → Sign up / Sign in → Workspace → Create Campaign → Media Plan / TT → Campaign Compiler → Figma Creative Workspace → Publish Creative → Campaign Wall → Live Compliance → Delivery Build`

The cloud product must have all normal customer entry points, authentication/access states, empty/loading/error/success states, account/workspace navigation, and a coherent route structure. A backend endpoint or CI-green component is never a substitute for a visible user-facing step.

## 1. Product north star

**Media Plan → TT Intelligence → Creative Adaptation → Live Compliance → Delivery**

Bannermatic is not positioned as an AI resizer. The differentiator is the **Campaign Compiler**: the system determines what a campaign requires, creates the creative set, validates each placement, keeps creative and delivery state connected, and prepares the campaign for delivery.

Campaign Compiler must remain the dominant product narrative and primary action. Resize, animation, AI and export are supporting capabilities.

## 2. Product ownership boundary

### Figma owns Creative
- master creative
- layers and assets
- layout and composition
- animation, timeline, keyframes, easing
- format-specific creative overrides
- creative edits and creative versions

### Cloud owns Campaign Specification
- campaigns and workspaces
- media plans
- placements
- TT / technical requirements
- TT Knowledge and provenance
- tracking / click URLs
- campaign versions and readiness
- compliance
- delivery builds
- access, roles and membership

Cloud can request a creative change but must never silently rewrite Figma creative. Cloud TT/media-plan changes must not destroy layout, animation or manual overrides.

## 3. Single domain model

Manual input and Media Plan import are two entry points into the same model:

`Workspace → Campaign → Placements → unique Visual Formats → TT → Creative Versions → Compliance → Delivery Builds`

A size is not a placement. Multiple placements may share one visual format while retaining independent TT, tracking and delivery metadata.

## 4. Mandatory implementation states and truthfulness

Never collapse these states:
- `DESIGNED`
- `CODED`
- `TESTED`
- `PUSHED`
- `DEPLOYED`
- `CLOUD RUNTIME VERIFIED`
- `FIGMA RUNTIME VERIFIED` where applicable
- `DONE`

A feature is not `DONE` until its complete customer scenario passes runtime verification in the applicable production/test environment.

**CI success is only evidence that code passed CI. It is not evidence that the user can see or use the feature.**

Never describe any of the following as a product result by itself:
- a commit;
- a PR;
- a green CI run;
- a TypeScript interface/domain model;
- an API endpoint not exercised through the product;
- a mock UI;
- a screen not deployed to the customer-facing domain;
- a plugin function not verified in Figma.

Never invent commit SHAs, CI results, deployment status, local state, browser state, server state or Figma runtime results.

If the user cannot see the claimed cloud change at the agreed test URL, report it as **not deployed / not runtime verified**, not as completed work.

## 5. Mandatory visible deployment loop

The agreed customer-visible MVP2 test surface is:

**https://ads.rechord.online/**

During MVP2 development, every user-testable cloud slice must follow this loop:

1. implement;
2. test and build;
3. push exact HEAD;
4. deploy that exact build to `ads.rechord.online`;
5. open/check the deployed route and critical actions;
6. only then report what changed and give the exact route for user inspection.

The user must not have to infer progress from GitHub or CI. **Visible product progress on the test domain is the default development output.**

For Figma-dependent slices, deploy the Cloud side first when relevant, then verify the plugin against that deployed Cloud environment. Do not mark the Figma slice complete until the real plugin runtime passes.

Do not silently replace the agreed domain with localhost, a mock URL, a storybook, or a developer-only route.

## 6. MVP2 acceptance contract and checklist discipline

The source of truth for implementation scope is `docs/MVP2_CHECKLIST.md`. `docs/MVP2_STATUS.md` records evidence/state only; it may not redefine scope.

Before each substantial change:
1. read this file and `docs/MVP2_CHECKLIST.md`;
2. identify the exact unchecked checklist item(s);
3. verify they support Campaign Compiler and the full customer journey;
4. implement on `codex/bannermatic-mvp2` or the active child branch recorded in the handoff below;
5. add/update feature tests;
6. run tests, production build and server checks;
7. deploy customer-visible Cloud work to the agreed test domain;
8. perform browser/runtime verification;
9. perform Figma runtime verification where applicable;
10. update `docs/MVP2_STATUS.md` with evidence;
11. only then mark an acceptance checkbox complete.

Do not jump to lower-level infrastructure work while a missing customer-facing entry point makes the current journey impossible, unless that infrastructure is the direct blocker for that entry point.

## 7. Required end-to-end MVP2 result

MVP2 is not complete until this real flow works:
1. anonymous visitor opens a polished Bannermatic marketing homepage;
2. visitor understands Campaign Compiler and has clear primary CTA;
3. user signs up/signs in;
4. creates/enters a workspace and creates a campaign;
5. uploads a real media plan / client TT or uses the manual campaign path;
6. Campaign Compiler builds placements and deduplicated unique visual formats;
7. user reviews TT coverage, provenance, conflicts and Unknown states;
8. campaign opens/connects in Figma and only missing formats are created from the master;
9. designer edits/adapts/animates in Figma;
10. Publish Creative creates a new cloud creative version;
11. Campaign Wall shows the whole campaign with format/placement labels and playable previews;
12. Play All / Pause / Replay and shared campaign timing work for live previews;
13. Live Compliance calculates placement readiness;
14. creative updates from Figma update Cloud without losing media-plan/TT state;
15. media-plan updates show a diff and request missing formats without damaging existing creative;
16. final Campaign Build creates placement-specific deliverables;
17. user can reach account/workspace/settings and sign out normally;
18. the complete flow is verified on the deployed customer-facing domain plus real Figma runtime.

## 8. Marketing website and SaaS product quality

Bannermatic must be credible as a premium commercial SaaS from the first anonymous page through final campaign delivery.

Reference quality bar: leading modern AI SaaS products such as OpenRouter and Higgsfield — use their strengths as quality references, **not as visual copies**.

The public/customer experience must include, at minimum:
- premium marketing homepage;
- clear Bannermatic value proposition and Campaign Compiler demonstration;
- product/feature explanation sufficient for a first-time user;
- primary Sign up / Get started CTA and Sign in entry point;
- authentication screens;
- authenticated SaaS shell;
- workspace/campaign navigation;
- empty states and onboarding;
- campaign creation/import flow;
- Campaign Wall;
- TT/compliance/delivery views;
- account/workspace/settings/sign-out entry points;
- responsive behavior;
- RU/EN language switching and persistent locale preference.

No internal-looking dashboard, raw table dump, debug controls, placeholder copy, dead navigation, fake metrics, fake testimonials, fake customer logos or fake production data may be presented as finished SaaS UI.

## 9. Real design system is mandatory

Use one explicit design system across marketing, auth and product UI. The design system must be implemented in code and documented, not merely described.

Required foundations:
- typography scale and font roles;
- spacing scale;
- layout/grid/container rules;
- color tokens and semantic colors;
- radii;
- elevation/surfaces;
- borders;
- icon sizing;
- motion/duration/easing tokens;
- responsive breakpoints;
- focus ring/accessibility tokens;
- density rules for data-heavy campaign UI.

Required reusable components include at least Button variants/sizes/states; Input/Textarea/Select; Checkbox/Radio/Switch; Tabs/Segmented control; Badge/Status; Tooltip; Dropdown/Menu; Modal/Drawer; Card/Surface; Table/Data row; Empty state; Skeleton/loading state; Toast/inline feedback; App navigation/sidebar/header; campaign/format/placement preview cards.

Every screen must consume the same tokens/components. One-off CSS that creates visually inconsistent controls is a defect.

## 10. Mandatory UX/UI audit gate

Every customer-visible slice requires a UX/UI audit before `DONE`: hierarchy and primary action; no duplicate editors; progressive disclosure; first-time-user copy; hover/focus/active/disabled/loading/error/success states; keyboard/focus behavior; desktop/tablet/mobile; design-system consistency; no clipping/overflow/layout jumps; useful empty/error states; Campaign Compiler remains dominant.

A screen that merely functions but looks like an internal prototype is **not complete**.

## 11. Campaign Wall requirements

Campaign Wall is a flagship MVP2 screen and must support all unique campaign creatives together, explicit format labels, placement labels/statuses, Creative/Delivery views, multiple placement statuses on one creative, live HTML previews, Play/Pause/Replay All, shared campaign playhead, Open in Figma, and readiness N/N.

Static/SVG snapshots are useful review fallbacks but are **not** equivalent to live HTML animation previews and must never be presented as such.

## 12. Authentication and access rules

Target roles: Owner, Admin, Designer, Producer, Viewer.

Server must be the authority for authentication, sessions, workspace membership and role enforcement. Client-side role hiding alone is insufficient. The customer journey must include visible sign-up/sign-in/sign-out/account/workspace entry points. Do not claim production authentication while the UI uses local-only preview sessions. Do not store raw passwords or expose tokens/secrets.

## 13. Persistence and versioning

Cloud state must be server-persistent. LocalStorage may be used only for non-authoritative UI preferences such as locale.

Required version model: Creative version, Media Plan version, TT snapshot version, and Campaign Build pins all three. Published creative versions and delivery builds must become immutable/reproducible.

## 14. TT rules

Client campaign TT overrides public/platform TT. Deterministic platform + placement + size matching is preferred before AI. AI is used for ambiguous/incomplete/document extraction cases. Unknown remains Unknown. Every effective rule needs provenance and checked-at metadata. TT updates require explicit diff/confirmation. Normal TT management belongs in Cloud; Figma gets designer-relevant context/status, not a second TT admin surface.

## 15. AI rules

AI is a real decision-support layer, not fake placeholder logic. Creative adaptation follows Anchor + Delta: deterministic safe anchor first; AI relative corrections; constraints reapplied; output remains human-editable. Paid AI calls must not happen automatically unless the user action explicitly invokes them or the product flow has an approved paid step.

## 16. Technical safety

Preserve working plugin/editor functionality. Prefer additive/new-version files for risky rewrites until verified. Never use destructive git/filesystem operations for convenience. No `rm -rf`, destructive resets or force pushes without explicit approval. Preserve unrelated local changes. Never commit secrets. Production deployment is a separate state from `PUSHED`.

## 17. Testing rules

At minimum before claiming a code slice `TESTED`: `npm test`; `npm run build`; server syntax checks used by CI; relevant feature tests; no failing CI on the current exact HEAD.

For customer-visible work, `TESTED` is followed by `DEPLOYED` and `CLOUD RUNTIME VERIFIED`; tests do not replace those states. Final acceptance requires a fresh-user end-to-end run, not only seeded/regression state.

## 18. Reporting format

Use only real evidence:

`DESIGNED: yes/no`
`CODED: yes/no`
`TESTED: yes/no — exact run/result`
`PUSHED: yes/no — exact SHA`
`DEPLOYED: yes/no — exact environment/build`
`CLOUD RUNTIME VERIFIED: yes/no — exact route/scenario`
`FIGMA RUNTIME VERIFIED: yes/no — exact scenario or n/a`
`DONE: yes/no`

**Never report absence of visible product output as a successful product result. Never hide an unresolved dependency behind the words ready, done, implemented, working, production, or complete.**

---

# 19. SESSION CONTINUATION PROTOCOL — mandatory

This section exists specifically so development survives a new chat/session/context reset without changing direction.

When the user says **`ПРОДОЛЖИ`**, **`продолжай`**, **`делай`**, or an equivalent instruction to resume Bannermatic development:

1. **Do not ask the user to reconstruct context.**
2. Read, in this order: `MVP2_RULES.md` → `docs/MVP2_CHECKLIST.md` → `docs/MVP2_STATUS.md` → active PR/branch exact HEAD → latest CI for that HEAD.
3. Treat the **Current handoff** section below as the starting checkpoint, then reconcile it against GitHub because GitHub evidence wins if newer.
4. Resume from the first unfinished dependency in the existing end-to-end plan. Do not invent a new roadmap and do not restart already implemented slices.
5. Preserve the architecture: Figma owns Creative; Cloud owns Campaign; Campaign Compiler is the product core.
6. Preserve the design direction and premium SaaS quality bar.
7. Continue autonomously through the checklist. **Do not stop after a commit, a green CI run, a small slice, a status report, or a non-critical implementation decision.**
8. After each slice: inspect failures, fix them, run the next applicable checks, deploy when deployment is available, verify runtime, then continue to the next unchecked item.
9. Ask the user only when an action genuinely requires user-only approval/input, including destructive operations, paid actions not already approved, unavailable secret/credential provisioning, or a product decision that cannot safely be inferred from this contract/checklist.
10. A blocked deployment does **not** mean development stops. Record the blocker truthfully, continue every independent checklist item that can be completed safely, and return to deployment as soon as access exists.
11. A failing CI does **not** mean development stops. Inspect the failure, repair it, rerun, and continue.
12. A tool/session interruption does **not** justify changing plan. On recovery, repeat steps 1–4 and continue.
13. Do not produce an interim “result” merely because one internal layer was implemented. The goal is the complete MVP2 acceptance flow.
14. Stop only when one of these is true:
    - the complete MVP2 checklist and end-to-end runtime acceptance are finished; or
    - a genuine external blocker prevents all useful remaining work; or
    - the user explicitly says to stop/pause/change direction.

**Default behavior after `ПРОДОЛЖИ`: work continuously down the existing checklist toward complete MVP2.**

# 20. CURRENT HANDOFF — 2026-09-05

## Active development line
- Repository: `mike-sabadash/banner-editor`
- Active branch: `codex/mvp2-figma-cloud-runtime`
- Active PR: `#44` — Connect Figma runtime to Bannermatic Cloud contract.
- Do not merge PR #44 without explicit user approval.
- Last fully verified CI checkpoint before the latest versioning changes: **Plugin final checks #167 — success**.
- The branch advanced after that checkpoint with creative-version work; therefore **the exact current HEAD must be fetched and its CI checked before calling the latest changes TESTED**.

## Customer-visible runtime truth
- Required test URL: `https://ads.rechord.online/`.
- As last directly observed by the user, `/` displays `{"error":"Not found"}`.
- This means the domain currently routes the root request to backend/API instead of serving the Bannermatic frontend build.
- Therefore current truth is: `DEPLOYED: no`, `CLOUD RUNTIME VERIFIED: no`, `DONE: no` for the customer SaaS.
- Do not tell the user to test the website until a frontend build is actually deployed and the root route has been opened/verified.
- Automated deploy workflow exists, but deployment was blocked because repository secret `BANNERMATIC_SERVER_SSH_KEY` was not available to the workflow. Re-check this on continuation; do not assume the blocker still exists.

## Implemented/code-progress that must be preserved
- Premium marketing/auth/SaaS design-system direction and customer-path components exist in the branch.
- Primary modular SaaS shell is being assembled from the newer MVP2 workspaces rather than deleting legacy shells.
- Server-backed auth/persistent campaign foundation exists.
- Campaign Compiler domain model and equal-size dedupe exist.
- Media Plan import/re-import diff/review-before-compile exists in code.
- Manual setup was added as a second entry into the same placement model; do not create a parallel manual-only domain model.
- TT/compliance/delivery workspace foundations exist; they are not all runtime-complete.
- Campaign Wall exists with format/placement cards and shared playback UI.
- Live HTML animation preview is **not yet complete**. SVG/Figma snapshots are fallback review representations, not live animation.
- Cloud↔Figma secure pairing was added: one-time short pairing code → scoped plugin token for one campaign; do not replace it with copying raw user auth tokens.
- Additive MVP2 Figma manifest/runtime was created to avoid breaking legacy `ui-v14/code-v8` before verification.
- Figma sync is designed to create only missing sizes and preserve existing creative.
- Publish Creative uses a scoped Cloud endpoint and creative-version model.
- Creative snapshot/version persistence work has begun; reconcile latest files/tests before continuing.

## Immediate continuation order
When development resumes, do these without waiting for another planning discussion:
1. Fetch exact branch HEAD and CI. Fix any failure introduced after CI #167.
2. Finish immutable Creative publish/version persistence and make Cloud campaign state refresh immediately after Publish Creative.
3. Finish real Figma → Cloud preview publication. Preserve SVG snapshot as fallback, but implement real HTML/animation preview for the Campaign Wall.
4. Finish/verify shared Campaign Wall playback against actual live previews.
5. Runtime-test Figma pairing: connect campaign, create missing formats only, second sync creates no duplicates, existing creative remains unchanged, publish increments Cloud creative version.
6. Finish effective TT Intelligence/provenance/update-diff Cloud flow.
7. Finish real Live Compliance: dimensions, ZIP, duration, clickTag/click URL, tracking, safe-zone/required elements where rules exist, N/N readiness.
8. Finish immutable Media Plan versions and TT snapshots; Campaign Build must pin Creative + Media Plan + TT snapshot.
9. Finish placement-specific Delivery Builds and final Build & Download Campaign flow.
10. Complete remaining auth/access/workspace/settings/invite/role and RU/EN gaps from the checklist.
11. Complete design-system, responsive, accessibility and UX/UI audit across marketing → auth → app → campaign → delivery.
12. Restore/verify deployment, deploy exact tested build to `ads.rechord.online`, then run fresh-user browser E2E from marketing page through final campaign delivery.
13. Run real Figma runtime E2E against that deployed Cloud environment.
14. Update `docs/MVP2_STATUS.md` and only check `docs/MVP2_CHECKLIST.md` items backed by runtime evidence.

## Remaining product acceptance
The remaining work is defined exhaustively by every unchecked item in `docs/MVP2_CHECKLIST.md`. The list above is execution order, **not a replacement or reduction of the checklist**. If an unchecked checklist item is omitted from the execution-order summary, it still must be completed before MVP2 is DONE.

## Continuity rule
Do not reinterpret the next session as a new project. Do not revert to MVP1 architecture, a standalone banner editor, or an AI-resize-only product. Continue the same Bannermatic full-SaaS line until the acceptance contract is complete.
