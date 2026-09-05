# Bannermatic MVP2 — delivery checklist

This checklist is the acceptance contract for MVP2. A checkbox may be marked complete only after the applicable chain is true: **DESIGNED → CODED → TESTED → PUSHED → RUNTIME VERIFIED**. Never report a product capability as done based only on design or code presence.

## Product north star
**Media Plan → TT Intelligence → Creative Adaptation → Live Compliance → Delivery**

Ownership rule:
- **Figma owns Creative**: master, layers, assets, layout, animation, overrides.
- **Cloud owns Campaign Specification**: placements, media plan, TT, tracking, compliance, versions, delivery.
- Cloud may request a creative change, but must not silently rewrite Figma creative.

## P0 — product shell and system foundations
- [ ] Premium SaaS entry point and consistent application shell.
- [ ] Real design system: tokens, typography, spacing, controls, states, responsive breakpoints.
- [ ] UX/UI audit against the design system for every new screen.
- [ ] Multi-language architecture with RU and EN product copy.
- [ ] Real authentication and persistent sessions.
- [ ] Workspace membership and access levels: Owner, Admin, Designer, Producer, Viewer.
- [ ] Route/access guards for cloud screens and campaign actions.
- [ ] Campaign list and create-campaign flow.

## P0 — Campaign Compiler
- [ ] One domain model: Campaign → Placements → unique Visual Formats → TT.
- [ ] Manual campaign setup and Media Plan import fill the same model.
- [ ] Excel/CSV input recognizes platform, placement, size and available TT fields.
- [ ] Client TT documents/links can be attached to a campaign.
- [ ] Equal sizes deduplicate to one visual format while preserving every placement.
- [ ] Review screen shows placements, unique creatives, TT coverage, conflicts and Unknown.
- [ ] Re-import produces a diff and never duplicates existing visual formats.
- [ ] Campaign compile produces the required creative set for Figma.

## P0 — Figma ↔ Cloud contract
- [ ] Plugin connects to a cloud campaign through a stable campaign ID.
- [ ] Plugin receives required unique visual formats from Cloud.
- [ ] Plugin creates only missing formats; existing creative is preserved.
- [ ] Master/linked-format workflow remains the creative source of truth.
- [ ] Publish Creative creates a versioned cloud creative build.
- [ ] Cloud preview updates when a new creative version is published.
- [ ] Cloud changes to media plan/TT never overwrite Figma layout or animation.
- [ ] Open in Figma deep-link/workflow from each cloud creative.

## P0 — Campaign Wall
- [ ] Campaign Overview shows every unique creative with format and placement labels.
- [ ] Previews are live/playable rather than static thumbnails where HTML preview exists.
- [ ] Play All / Pause All / Replay All.
- [ ] Shared campaign playhead for synchronized review.
- [ ] Creative View and Delivery View.
- [ ] One visual format can expose several placement statuses without duplicate creative cards.
- [ ] Responsive premium layout on desktop/tablet/mobile.

## P1 — TT Intelligence
- [ ] TT Knowledge lives in Cloud, not as a primary editing workspace in Figma.
- [ ] Deterministic matching uses platform + placement + size.
- [ ] Client campaign TT overrides official/public TT.
- [ ] Every effective requirement has provenance and checked-at metadata.
- [ ] Unknown stays Unknown; no invented requirements.
- [ ] TT updates produce an explicit diff and require confirmation.
- [ ] Ambiguous matching requests a product/placement decision.

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

## P1 — versions and change management
- [ ] Creative version is immutable once published.
- [ ] Media Plan versions and import diffs.
- [ ] TT snapshot versions.
- [ ] Campaign Build pins Creative + Media Plan + TT snapshot.
- [ ] Existing build remains reproducible after future updates.

## P1 — delivery
- [ ] Placement-specific packages can reuse one visual creative with different tracking/URLs.
- [ ] HTML5 build.
- [ ] PNG/JPG/GIF/MP4 outputs where required.
- [ ] Platform preflight before delivery.
- [ ] Delivery dashboard: Ready / Warning / Blocked.
- [ ] Build & Download Campaign.

## P2 — later, not MVP2 acceptance
- DCO and feeds.
- Media buying / ad account publishing.
- Performance analytics and optimization.
- Full DAM.
- Enterprise approval chains.
- Video editor.

## Runtime acceptance scenario
A release is not MVP2-complete until this real flow works end-to-end:
1. New user signs up/signs in and creates a workspace/campaign.
2. Upload a real media plan.
3. Campaign Compiler produces placements and deduplicated visual formats.
4. User reviews TT coverage/conflicts.
5. Campaign opens in Figma and missing formats are created from the master.
6. Designer edits/adapts/animates and publishes creative.
7. Cloud Campaign Wall displays all campaign creatives and plays them.
8. Cloud validates every placement and reports N/N readiness.
9. A creative change in Figma publishes a new version and updates Cloud without losing media-plan/TT state.
10. A media-plan change creates a diff and required missing formats without damaging existing creative.
11. A final Campaign Build generates placement-specific deliverables.
12. The whole flow is verified on the production domain.