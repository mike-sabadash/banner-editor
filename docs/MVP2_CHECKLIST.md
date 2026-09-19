# Bannermatic MVP2 — delivery checklist

This checklist is the acceptance contract for MVP2. A checkbox may be marked complete only after the applicable chain is true:

**DESIGNED → CODED → TESTED → PUSHED → DEPLOYED → CLOUD RUNTIME VERIFIED → FIGMA RUNTIME VERIFIED (where applicable) → DONE**

Never report a product capability as done based only on design, code presence, a commit, a PR, or green CI.

Mandatory onboarding contract: `docs/ONBOARDING_RULES.md`. **Every customer-facing feature includes its onboarding states as part of the feature definition; onboarding is not follow-up polish.**

## Product north star
**Media Plan → TT Intelligence → Creative Adaptation → Live Compliance → Delivery**

Ownership rule:
- **Figma owns Creative**: master, layers, assets, layout, animation, overrides.
- **Cloud owns Campaign Specification**: placements, media plan, TT, tracking, compliance, versions, delivery.
- Cloud may request a creative change, but must not silently rewrite Figma creative.

Customer-facing test domain: **https://ads.rechord.online/**. Every user-testable Cloud slice must be deployed and verified there before its checkbox can close.

## P0 — public website and customer entry
- [ ] Premium Bannermatic marketing homepage on the customer-facing domain.
- [ ] Campaign Compiler is the dominant value proposition and primary CTA.
- [ ] Product explanation/demo section communicates Media Plan → Campaign outcome.
- [ ] Clear Sign in and Get started / Sign up entry points.
- [ ] RU/EN language switch available from the public experience.
- [ ] Responsive marketing experience on desktop/tablet/mobile.
- [ ] No placeholder/fake customer claims, metrics, logos, testimonials or dead CTAs.

## P0 — design system and SaaS shell
- [ ] Real coded design tokens: typography, spacing, color, radii, surfaces, borders, elevation, motion, breakpoints, focus.
- [ ] Reusable component library for buttons, fields, selects, tabs, badges, menus, modals/drawers, cards, tables, feedback, skeletons and empty states.
- [ ] Auth, marketing and application UI consume the same design language.
- [ ] Premium authenticated SaaS shell with workspace/campaign navigation.
- [ ] Account/workspace/settings/sign-out entry points.
- [ ] Empty/loading/error/success states for customer-facing flows.
- [ ] UX/UI audit against the design system for every screen.
- [ ] Accessibility/focus/keyboard audit for interactive controls.
- [ ] Responsive product UI on desktop/tablet/mobile.
- [ ] Multi-language architecture with complete RU and EN customer copy.

## P0 — continuous onboarding and guided journeys
- [ ] Onboarding is continuous from marketing entry through final Campaign Build; it is not a single welcome tour.
- [ ] Every primary screen explains where the user is, what the current step means and what the next action is.
- [ ] Every empty state teaches the next action instead of only reporting absence of data.
- [ ] Every disabled/blocked state explains why it is blocked and how to unblock it.
- [ ] Every validation/error state gives a recovery path where one exists.
- [ ] Multi-step flows expose progress, safe back-navigation and preserve user context.
- [ ] Manual Setup and Media Plan import each have first-use guidance and converge into the same Campaign Compiler explanation.
- [ ] TT onboarding explains verified/client/Unknown/conflict states and why a user decision is required.
- [ ] Figma connection onboarding explains pairing, missing-format creation, repeat sync behavior and Publish Creative.
- [ ] Campaign Wall onboarding explains creative vs delivery views, playback and placement/readiness context.
- [ ] Compliance onboarding explains Ready / Warning / Blocked and distinguishes “fix in Cloud” from “fix in Figma”.
- [ ] Delivery onboarding explains pinned versions, placement-specific outputs and why a build can be blocked.
- [ ] Role-specific onboarding handles Owner/Admin/Designer/Producer/Viewer permissions without exposing internal implementation details.
- [ ] Guidance uses progressive disclosure/coach marks/contextual help rather than one giant forced tutorial.
- [ ] Experienced users can dismiss local guidance and reopen relevant help later.
- [ ] Onboarding copy is complete in RU and EN and responsive on supported form factors.
- [ ] Fresh-user onboarding E2E reaches final Campaign Build without external documentation or developer explanation.

## P0 — authentication and access
- [ ] Customer-visible Sign up flow.
- [ ] Customer-visible Sign in flow.
- [ ] Persistent authenticated session backed by server authority.
- [ ] Sign out and session expiry behavior.
- [ ] Workspace creation/entry flow.
- [ ] Workspace membership and access levels: Owner, Admin, Designer, Producer, Viewer.
- [ ] Route/access guards for cloud screens and campaign actions.
- [ ] Unauthorized/forbidden states are handled in the UI.

## P0 — Campaigns
- [ ] Campaign list.
- [ ] Premium empty state for a new workspace.
- [ ] Create Campaign flow.
- [ ] Campaign Overview route.
- [ ] Campaign navigation: Overview / Media Plan / Creative / TT & Delivery.
- [ ] Campaign status/readiness visible without opening developer tooling.

## P0 — Campaign Compiler
- [ ] One domain model: Campaign → Placements → unique Visual Formats → TT.
- [ ] Manual campaign setup and Media Plan import fill the same model.
- [ ] Excel/CSV input recognizes platform, placement, size and available TT fields.
- [ ] Client TT documents/links can be attached to a campaign.
- [ ] Equal sizes deduplicate to one visual format while preserving every placement.
- [ ] Review screen shows placements, unique creatives, TT coverage, conflicts and Unknown.
- [ ] Re-import produces a diff and never duplicates existing visual formats.
- [ ] Media-plan update can be reviewed before application.
- [ ] Campaign compile produces the required creative set for Figma.
- [ ] Compiler result clearly summarizes placements → unique creatives → TT readiness.

## P0 — Figma ↔ Cloud contract
- [ ] Plugin connects to a cloud campaign through a stable campaign ID.
- [ ] Connection UX is usable by a normal designer without copying hidden developer data.
- [ ] Plugin receives required unique visual formats from Cloud.
- [ ] Plugin creates only missing formats; existing creative is preserved.
- [ ] Master/linked-format workflow remains the creative source of truth.
- [ ] Designer can adapt/edit/animate generated formats normally.
- [ ] Publish Creative creates a versioned cloud creative build.
- [ ] Cloud preview updates when a new creative version is published.
- [ ] Cloud changes to media plan/TT never overwrite Figma layout or animation.
- [ ] Media-plan update can request/create only newly missing formats.
- [ ] Open in Figma workflow from each cloud creative.
- [ ] Plugin shows relevant campaign/TT/compliance status read-only without becoming a duplicate TT admin UI.

## P0 — Campaign Wall
- [ ] Campaign Overview shows every unique creative with explicit format labels.
- [ ] Placement labels/statuses are visible for every creative.
- [ ] Previews are live/playable rather than static thumbnails where HTML preview exists.
- [ ] Play All / Pause All / Replay All.
- [ ] Shared campaign playhead for synchronized review.
- [ ] Creative View and Delivery View.
- [ ] One visual format can expose several placement statuses without duplicate creative cards.
- [ ] Open in Figma from creative context.
- [ ] Readiness summary N/N visible at campaign level.
- [ ] Responsive premium wall on desktop/tablet/mobile.
- [ ] Campaign Wall passes design-system/UX audit and does not look like an internal debug grid.

## P1 — TT Intelligence
- [ ] TT Knowledge lives in Cloud, not as a primary editing workspace in Figma.
- [ ] Deterministic matching uses platform + placement + size.
- [ ] Client campaign TT overrides official/public TT.
- [ ] Every effective requirement has provenance and checked-at metadata.
- [ ] Unknown stays Unknown; no invented requirements.
- [ ] TT updates produce an explicit diff and require confirmation.
- [ ] Ambiguous matching requests a product/placement decision.
- [ ] Effective TT can be inspected and edited through a premium Cloud workflow.
- [ ] TT source/update state is understandable without exposing internal parser/debug terminology.

## P1 — Live Compliance
- [ ] Placement-level readiness is recalculated for every published creative version.
- [ ] Dimensions validation.
- [ ] ZIP size validation/estimation.
- [ ] Animation duration validation.
- [ ] clickTag / click URL validation.
- [ ] tracking/impression pixel validation.
- [ ] Safe-zone and required-element checks where rules exist.
- [ ] Campaign readiness summary N/N.
- [ ] Safe auto-fix actions are explicit and reversible.
- [ ] Failed compliance links back to the exact creative/placement and offers Open in Figma when a creative change is required.

## P1 — versions and change management
- [ ] Creative version is immutable once published.
- [ ] Media Plan versions and import diffs.
- [ ] TT snapshot versions.
- [ ] Campaign Build pins Creative + Media Plan + TT snapshot.
- [ ] Existing build remains reproducible after future updates.
- [ ] Cloud shows which creative/media-plan/TT versions are currently active.

## P1 — delivery
- [ ] Placement-specific packages can reuse one visual creative with different tracking/URLs.
- [ ] HTML5 build.
- [ ] PNG/JPG/GIF/MP4 outputs where required.
- [ ] Platform preflight before delivery.
- [ ] Delivery dashboard: Ready / Warning / Blocked.
- [ ] Build & Download Campaign.
- [ ] Final build summary identifies included placements and pinned versions.

## P1 — final product audit
- [ ] Fresh-user end-to-end run starts from the public homepage, not a seeded authenticated state.
- [ ] Fresh-user onboarding E2E completes the whole journey without external explanation.
- [ ] Full RU journey audited.
- [ ] Full EN journey audited.
- [ ] Desktop journey audited.
- [ ] Tablet/mobile key journeys audited.
- [ ] Design consistency audit across marketing/auth/app/campaign/delivery.
- [ ] Onboarding consistency audit across marketing/auth/app/campaign/Figma handoff/compliance/delivery.
- [ ] No dead links, placeholder routes, debug-only controls or unexplained technical errors.
- [ ] Browser runtime verified on `ads.rechord.online`.
- [ ] Real Figma runtime verified against the deployed Cloud environment.

## P2 — later, not MVP2 acceptance
- DCO and feeds.
- Media buying / ad account publishing.
- Performance analytics and optimization.
- Full DAM.
- Enterprise approval chains.
- Video editor.

## Runtime acceptance scenario
A release is not MVP2-complete until this real flow works end-to-end:
1. New anonymous user opens the Bannermatic marketing homepage on `ads.rechord.online` and understands the product/next action without external explanation.
2. User switches language if desired and chooses Get started / Sign in with contextual guidance.
3. User signs up/signs in and enters/creates a workspace; first-use state explains what a workspace/campaign is.
4. User creates a campaign and is guided to the next required step.
5. User uploads a real media plan and optional client TT, or uses Manual setup; both paths explain what data is needed and how they converge.
6. Campaign Compiler produces placements and deduplicated visual formats and explains the result.
7. User reviews TT coverage/conflicts/Unknown, understands every unresolved state and confirms the campaign plan.
8. Campaign connects/opens in Figma; pairing guidance explains the boundary between Cloud and Figma and only missing formats are created.
9. Designer edits/adapts/animates and publishes creative with clear Publish/Sync guidance.
10. Cloud Campaign Wall displays all campaign creatives with labels and playable previews and explains Creative/Delivery review modes.
11. Play All / Pause / Replay and shared timing work.
12. Cloud validates every placement and reports N/N readiness; every Warning/Blocked result explains how and where to fix it.
13. A creative change in Figma publishes a new version and updates Cloud without losing media-plan/TT state.
14. A media-plan change creates a diff and required missing formats without damaging existing creative.
15. TT changes are versioned/diffed, user-confirmed and do not silently rewrite creative.
16. A final Campaign Build generates placement-specific deliverables; onboarding explains pinned versions and output structure.
17. User can inspect delivery state, account/workspace settings and sign out.
18. The whole flow, including onboarding branches, is verified as a customer-visible product on `ads.rechord.online` plus real Figma runtime.
