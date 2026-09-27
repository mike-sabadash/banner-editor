# Bannermatic — Diffusion Campaign Delivery checkpoint

Updated: 2026-09-27 (UTC)

## Resume point

- Repository: `mike-sabadash/banner-editor`
- Base branch: `feature/diffusion-editor-upstream`
- Working branch: `feature/campaign-diffusion-delivery-20260927`
- Base commit: `fcc5c9dae50fec1acd6d51c49508c3ce9d81cbc4`
- Production Studio: `https://studio.bannermatic.online`
- Deployment workflow: `.github/workflows/deploy-diffusion-upstream.yml`

## Product outcome

One continuous flow must work:

`Campaign -> Media Plan / manual placements -> unique visual formats -> Diffusion editor -> placement preflight -> campaign delivery ZIP`

The Campaign remains the source of truth. Equal dimensions share one editable visual format. Output type, click URL/tag, tracking pixel, weight limit, duration and TT provenance remain placement-specific.

## Delivery types

- HTML5 ZIP
- HTML5 ZIP + GIF fallback when required by TT
- JPG
- PNG
- GIF
- video (MP4/WebM according to the rendered artifact)

No output may be marked ready without an exact artifact, a passing weight check, required click behavior, and required tracking data.

## Implementation checklist

- [x] Deploy the Campaign shell at `/` and Diffusion at `/editor/` in one release.
- [x] Deep-link Campaign -> Diffusion with `campaignId` and optional `formatId`.
- [x] Load the selected Campaign and generate one Diffusion scene per unique format.
- [x] Show Campaign/format/placement/TT context inside Diffusion.
- [x] Preserve placement-specific output requirements when formats share dimensions.
- [x] Normalize media-plan output values including HTML5+GIF, JPG, PNG, GIF and video.
- [x] Add campaign artifact storage and authenticated upload/list API.
- [x] Publish Diffusion snapshot/video artifacts into the Campaign.
- [x] Build output files by placement, not only by visual format.
- [x] Validate actual bytes, dimensions, duration, click URL/tag and tracking before delivery.
- [x] Package all ready placements plus a complete manifest in one campaign ZIP.
- [x] Add UI status and actionable blockers in Delivery.
- [x] Run root tests/build and Diffusion typecheck/build.
- [ ] Run browser E2E for Campaign -> editor -> delivery on production.
- [ ] Push intermediate commits, open PR, deploy and record exact evidence below.

## Evidence

- Root tests: `79 passed`, `345 passed`.
- Root production build: passed.
- Diffusion web typecheck: passed.
- Diffusion web production build: passed.
- Local browser E2E before release: campaign edit persisted; Diffusion published a 300x250 PNG; delivery ZIP was created and validated.
- GitHub push, production merge, workflow completion and public production verification remain pending at this checkpoint.
