# Bannermatic MVP2 — Development Rules

This file is the persistent operating contract for MVP2 development. It supplements `AGENTS.md` and `docs/MVP2_CHECKLIST.md` and must be read before any substantial MVP2 change.

## 1. Product north star

**Media Plan → TT Intelligence → Creative Adaptation → Live Compliance → Delivery**

Bannermatic is not positioned as an AI resizer. The differentiator is the **Campaign Compiler**: the system determines what a campaign requires, creates the creative set, validates each placement, keeps creative and delivery state connected, and prepares the campaign for delivery.

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

## 4. Mandatory implementation states

Never collapse these states:
- `DESIGNED`
- `CODED`
- `TESTED`
- `PUSHED`
- `LOCAL`
- `RUNTIME VERIFIED`

A feature is not `DONE` until the complete user scenario passes runtime verification on the applicable environment. CI success is required but is not runtime proof.

Never invent commit SHAs, CI results, deployment status, local state or Figma/browser runtime results.

## 5. MVP2 acceptance contract

The source of truth for implementation scope is `docs/MVP2_CHECKLIST.md`.

Before each substantial change:
1. identify the checklist item(s) being addressed;
2. verify they support the new Campaign Compiler concept;
3. implement on `codex/bannermatic-mvp2` or a child branch;
4. run tests and production build;
5. run server syntax/checks;
6. only then update status/evidence;
7. do not mark a checklist checkbox complete until runtime verification is performed.

## 6. Required end-to-end MVP2 result

MVP2 is not complete until this real flow works:
1. user signs up/signs in;
2. creates/enters a workspace and creates a campaign;
3. uploads a real media plan / client TT;
4. Campaign Compiler builds placements and deduplicated unique visual formats;
5. user reviews TT coverage, conflicts and Unknown states;
6. campaign opens in Figma and only missing formats are created from the master;
7. designer edits/adapts/animates in Figma;
8. Publish Creative creates a new cloud creative version;
9. Campaign Wall shows the whole campaign with format/placement labels and playable previews;
10. Live Compliance calculates placement readiness;
11. creative updates from Figma update Cloud without losing media-plan/TT state;
12. media-plan updates show a diff and request missing formats without damaging existing creative;
13. final Campaign Build creates placement-specific deliverables;
14. the full flow is verified on the production domain.

## 7. Cloud UX requirements

Bannermatic must look and behave like a premium SaaS product, not an internal admin panel.

Mandatory principles:
- one consistent design system across authentication, campaigns, campaign wall, media plan, TT, delivery and settings;
- design tokens for typography, spacing, radii, color, elevation, states and breakpoints;
- consistent interactive states: default / hover / active / focus / disabled / loading / error / success;
- responsive desktop/tablet/mobile behavior;
- RU and EN architecture from the start;
- information hierarchy should follow campaign workflow, not internal code structure;
- avoid duplicate editors for the same data;
- use progressive disclosure for technical detail;
- Campaign Compiler remains the primary CTA and primary narrative.

Every new screen requires UX/UI audit against the design system before it can be called complete.

## 8. Campaign Wall requirements

Campaign Wall is a flagship MVP2 screen and must eventually support:
- all unique campaign creatives visible together;
- explicit format labels;
- placement labels/statuses;
- Creative View and Delivery View;
- one visual creative with multiple placement statuses;
- live HTML previews where available;
- Play All / Pause All / Replay All;
- shared campaign playhead;
- Open in Figma for creative changes;
- readiness summary N/N.

Static mock previews are not equivalent to live HTML previews.

## 9. Authentication and access rules

Target roles:
- Owner
- Admin
- Designer
- Producer
- Viewer

Server must be the authority for authentication, sessions, workspace membership and role enforcement. Client-side role hiding alone is insufficient.

Do not claim production authentication while the UI uses localStorage-only preview sessions.

Do not store raw passwords. Do not expose tokens/secrets in UI, logs, Notion, GitHub or documentation.

## 10. Persistence and versioning

Cloud state must be server-persistent. LocalStorage may be used only for non-authoritative UI preferences such as locale.

Required version model:
- Creative version
- Media Plan version
- TT snapshot version
- Campaign Build pins all three

Published creative versions and delivery builds must become immutable/reproducible once that layer is implemented.

## 11. TT rules

- Client campaign TT overrides public/platform TT.
- Deterministic platform + placement + size matching is preferred before AI.
- AI is used for ambiguous, incomplete or document-extraction cases.
- Unknown remains Unknown; never invent requirements.
- Every effective rule must support provenance and checked-at metadata.
- TT updates require explicit diff/confirmation before affecting campaign readiness.

## 12. AI rules

AI is a real decision-support layer, not fake placeholder logic.

For creative adaptation use the existing Anchor + Delta principle:
- deterministic safe anchor first;
- AI returns relative corrections;
- geometry/safe constraints are reapplied after AI;
- output remains human-editable.

Paid AI calls must not happen automatically unless the user action explicitly invokes them or the product flow has an approved paid step.

## 13. Technical safety

- Preserve existing working plugin/editor functionality while MVP2 is developed.
- Prefer additive/new-version files for risky large UI rewrites until verified.
- Never use destructive git/filesystem operations for convenience.
- No `rm -rf`, destructive resets or force pushes without explicit approval.
- Preserve unrelated local changes/untracked files.
- Never commit `.env`, API keys, passwords, SSH private keys or raw tokens.
- Production deployment is a separate state from `PUSHED`; do not redeploy silently.

Known project infrastructure exists already (GitHub repository, production VPS, domains, OpenRouter gateway). Access details and secrets stay outside this file.

## 14. Testing rules

At minimum before claiming a code slice `TESTED`:
- `npm test`
- `npm run build`
- server syntax checks used by CI
- relevant feature tests added/updated
- no failing CI on the current exact HEAD

Runtime verification is still separate.

## 15. Reporting format

Use only real evidence:

`DESIGNED: yes/no`
`CODED: yes/no`
`TESTED: yes/no — actual command/run/result`
`PUSHED: yes/no — exact SHA`
`LOCAL: yes/no`
`RUNTIME VERIFIED: yes/no`

Then name the next unchecked checklist item. Never hide an unresolved dependency behind the word `ready`.
