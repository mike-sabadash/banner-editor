# Figma Asset Bridge — Canonical Checklist

> This is the SAME checklist for every continuation. Do not create replacement checklists.
> Update checkboxes in place. Full design rationale lives in the canonical Notion specification linked from `FIGMA_ASSET_BRIDGE_STATUS.md`.

## Phase 0 — Foundation & migration safety
- [x] 0.1 Feature flag `FIGMA_ASSET_BRIDGE`
- [x] 0.2 Extend FormatSpec: exportScale, maxBytes, exportType, requirementsSource
- [x] 0.3 Separate AssetSource model from canvas placement
- [x] 0.4 Add Figma provenance metadata
- [x] 0.5 Add semantic role to SceneLayer
- [x] 0.6 Enforce logical-coordinate geometry invariant
- [x] 0.7 Additive migration only
- [x] 0.8 Backward compatibility for old campaigns
- [x] 0.9 Serialization/deserialization tests
- [x] 0.10 Regression: Responsive Masters/animation/timeline/AI Director unchanged
- [x] Gate 0 PASS

## Phase 1 — Technical Requirements + @1x/@2x
- [x] 1.1 exportScale 1|2 per format
- [x] 1.2 default @1x
- [x] 1.3 Media Plan/TT can set @2x
- [x] 1.4 maxBytes
- [x] 1.5 export type HTML5/JPG/PNG/WebP
- [x] 1.6 separate logical and physical export size
- [x] 1.7 200×300 @2x remains 200×300 editor canvas
- [x] 1.8 physical export becomes 400×600
- [x] 1.9 advanced manual scale override
- [x] 1.10 mark override as manual
- [x] 1.11 @2x badge
- [x] 1.12 weight-limit badge
- [x] 1.13 export-type badge
- [x] 1.14 preserve MASTER/AUTO
- [x] 1.15 compact badge UX
- [x] 1.16 campaign summary N formats require @2x
- [x] 1.17 summary filters/highlights formats
- [x] Gate 1 PASS

## Phase 2 — Asset Quality / Density Engine
- [x] 2.1 sourceWidth/sourceHeight
- [x] 2.2 placed physical size
- [x] 2.3 effective source density
- [x] 2.4 400×600→200×300 = 2×
- [x] 2.5 300×450→200×300 = 1.5×
- [x] 2.6 200×300→200×300 = 1×
- [x] 2.7 compare density with required exportScale
- [x] 2.8 OK state
- [x] 2.9 Warning state
- [x] 2.10 Insufficient state
- [x] 2.11 source resolution never changes visual object size
- [x] 2.12 Asset Quality Inspector
- [x] 2.13 source/placed/required display
- [x] 2.14 per-format warning
- [x] 2.15 campaign insufficient-assets list
- [x] Gate 2 PASS

## Phase 3 — Figma Connection
- [x] 3.1 server-side Figma integration
- [x] 3.2 no credentials in frontend
- [x] 3.3 secure credential storage
- [x] 3.4 figma/status endpoint
- [x] 3.5 connect/reconnect
- [x] 3.6 disconnect
- [x] 3.7 expired/revoked token handling
- [x] 3.8 listFiles
- [x] 3.9 getFile
- [x] 3.10 pages
- [x] 3.11 frames
- [x] 3.12 getNodes
- [x] 3.13 exportNodes
- [x] 3.14 getVersion
- [x] 3.15 timeouts/retries
- [x] 3.16 rate-limit handling
- [x] Gate 3 PASS

## Phase 4 — Figma Browser + Frame Detection
- [x] 4.1 Import design entry point
- [x] 4.2 source picker
- [x] 4.3 Figma source
- [x] 4.4 file picker
- [x] 4.5 page picker
- [x] 4.6 frame browser
- [x] 4.7 frame preview
- [x] 4.8 read actual dimensions
- [x] 4.9 exact campaign-format match
- [x] 4.10 frame name secondary signal
- [x] 4.11 META_300x600_V1 → 300×600
- [x] 4.12 multiple frame matches
- [x] 4.13 duplicate-size handling
- [x] 4.14 nearest family suggestion
- [x] 4.15 no automatic nearest apply
- [x] 4.16 multi-select
- [x] 4.17 mapping preview
- [x] Gate 4 PASS

## Phase 5 — Figma Layer Normalization
- [x] 5.1 parse node tree
- [x] 5.2 TEXT → editable text
- [x] 5.3 IMAGE fill → AssetSource
- [x] 5.4 simple VECTOR
- [x] 5.5 RECTANGLE
- [x] 5.6 ELLIPSE
- [x] 5.7 groups
- [x] 5.8 nested frames
- [x] 5.9 masks
- [x] 5.10 effects
- [x] 5.11 blend modes
- [x] 5.12 unsupported → visual fallback
- [x] 5.13 preserve visual fidelity in fallback
- [x] 5.14 no Figma Auto Layout runtime
- [x] 5.15 no component/variable/plugin runtime dependency
- [x] 5.16 z-order
- [x] 5.17 opacity
- [x] 5.18 crop
- [x] 5.19 rotation
- [x] 5.20 frame-relative geometry
- [x] Gate 5 PASS

## Phase 6 — Semantic Layer Mapper
- [x] 6.1 normalize names
- [x] 6.2 background aliases
- [x] 6.3 product/hero
- [x] 6.4 logo/brand
- [x] 6.5 headline/title
- [x] 6.6 cta/button
- [x] 6.7 legal/disclaimer
- [x] 6.8 decor
- [x] 6.9 node type signal
- [x] 6.10 position signal
- [x] 6.11 relative-size signal
- [x] 6.12 confidence
- [x] 6.13 deterministic mapping priority
- [x] 6.14 AI only for ambiguous layers
- [x] 6.15 minimize AI payload
- [x] 6.16 rule/AI/user provenance
- [x] 6.17 Semantic Role Review UI
- [x] 6.18 unknown layers visible
- [x] 6.19 manual correction
- [x] 6.20 persist correction
- [x] Gate 6 PASS

## Phase 7 — Import Plan
- [x] 7.1 read-only ImportPlan
- [x] 7.2 no campaign mutation during plan
- [x] 7.3 selected frames
- [x] 7.4 target formats
- [x] 7.5 layer count
- [x] 7.6 semantic roles
- [x] 7.7 unknown layers
- [x] 7.8 unsupported effects
- [x] 7.9 source-resolution warnings
- [x] 7.10 conflicts
- [x] 7.11 result preview
- [x] 7.12 batch import CTA
- [x] Gate 7 PASS

## Phase 8 — Apply Import
- [x] 8.1 Undo checkpoint
- [x] 8.2 materialize assets into Bannermatic storage
- [x] 8.3 no runtime Figma CDN dependency
- [x] 8.4 AssetSource records
- [x] 8.5 SceneLayers
- [x] 8.6 provenance
- [x] 8.7 fingerprints
- [x] 8.8 node IDs
- [x] 8.9 single-frame import
- [x] 8.10 multi-frame batch
- [x] 8.11 4–6 key compositions
- [x] 8.12 preserve scenes
- [x] 8.13 preserve timeline
- [x] 8.14 preserve animation
- [x] 8.15 undo full import
- [x] 8.16 retry without duplicates
- [x] Gate 8 PASS

## Phase 9 — Responsive Masters handoff
- [x] 9.1 imported exact formats → Family Master candidates
- [x] 9.2 Use as Family Master
- [x] 9.3 geometry family
- [x] 9.4 master snapshot
- [x] 9.5 intermediate rollout
- [x] 9.6 override precedence
- [x] 9.7 no parallel Figma inheritance
- [x] 9.8 portrait
- [x] 9.9 tall
- [x] 9.10 rectangle
- [x] 9.11 wide
- [x] 9.12 strip
- [x] 9.13 micro-strip
- [x] 9.14 extreme formats
- [x] 9.15 MASTER/AUTO wall status
- [x] 9.16 4–6 masters cover campaign
- [x] Gate 9 PASS

## Phase 10 — Update from Figma
- [x] 10.1 Update from Figma action
- [x] 10.2 version check
- [x] 10.3 fingerprint comparison
- [x] 10.4 added
- [x] 10.5 removed
- [x] 10.6 asset changed
- [x] 10.7 geometry changed
- [x] 10.8 text changed
- [x] 10.9 unchanged
- [x] 10.10 diff UI
- [x] 10.11 default assets-only
- [x] 10.12 explicit layout+assets
- [x] 10.13 preserve animation
- [x] 10.14 preserve timeline
- [x] 10.15 preserve semantic role
- [x] 10.16 preserve local corrections for assets-only
- [x] 10.17 conflict detection
- [x] 10.18 no silent deletion
- [x] 10.19 checkpoint
- [x] 10.20 undo update
- [x] Gate 10 PASS

## Phase 11 — Export Optimizer
- [x] 11.1 physicalWidth = logicalWidth × exportScale
- [x] 11.2 physicalHeight
- [x] 11.3 required raster resolution per layer
- [x] 11.4 crop
- [x] 11.5 resize
- [x] 11.6 preserve SVG
- [x] 11.7 preserve text/vector where possible
- [x] 11.8 JPG
- [x] 11.9 PNG
- [x] 11.10 WebP
- [x] 11.11 HTML5
- [x] 11.12 maxBytes
- [x] 11.13 bounded quality search
- [x] 11.14 layer-aware optimization
- [x] 11.15 background compression priority
- [x] 11.16 product quality priority
- [x] 11.17 logo vector priority
- [x] 11.18 blocking impossible-limit warning
- [x] 11.19 no silent quality degradation
- [x] 11.20 diagnostics
- [x] Gate 11 PASS

## Phase 12 — AI Director integration
- [x] 12.1 FormatSpec context
- [x] 12.2 resolved layouts
- [x] 12.3 exportScale context
- [x] 12.4 maxBytes context
- [x] 12.5 density warnings
- [x] 12.6 AI cannot invent/change @2x
- [x] 12.7 layout correction
- [x] 12.8 optional decor/copy suppression
- [x] 12.9 semantic roles
- [x] 12.10 Verification Pass
- [x] 12.11 Layout warnings
- [x] 12.12 Asset Quality warnings
- [x] 12.13 Export Requirement warnings
- [x] 12.14 warning → format/layer navigation
- [x] Gate 12 PASS

## Phase 13 — Security & production hardening
- [x] 13.1 encrypted credentials
- [x] 13.2 no token in client/localStorage
- [x] 13.3 MIME validation
- [x] 13.4 SVG sanitization
- [x] 13.5 file-size limits
- [x] 13.6 node-count limits
- [x] 13.7 concurrent-import limits
- [x] 13.8 timeout handling
- [x] 13.9 rate-limit handling
- [x] 13.10 expired/revoked auth
- [x] 13.11 deleted Figma file
- [x] 13.12 deleted node
- [x] 13.13 renamed node
- [x] 13.14 large-document stress
- [x] 13.15 import telemetry
- [x] 13.16 unknown-role metric
- [x] 13.17 conflict metric
- [x] 13.18 export-failure metric
- [x] Gate 13 PASS

## Phase 14 — Full E2E / Release
- [ ] 14.1 real test campaign
- [ ] 14.2 real Figma file
- [ ] 14.3 minimum four key frames
- [ ] 14.4 @1x raster case
- [ ] 14.5 @2x raster case
- [ ] 14.6 SVG logo
- [ ] 14.7 editable text
- [ ] 14.8 unsupported-effect fallback
- [ ] 14.9 batch import
- [ ] 14.10 semantic roles
- [ ] 14.11 visual fidelity
- [ ] 14.12 Family Masters
- [ ] 14.13 intermediate rollout
- [ ] 14.14 extreme formats
- [ ] 14.15 AI Director
- [ ] 14.16 Verification Pass
- [ ] 14.17 @2x badges
- [ ] 14.18 density warning
- [ ] 14.19 ≤150KB
- [ ] 14.20 @1x export
- [ ] 14.21 @2x export
- [ ] 14.22 change Figma asset
- [ ] 14.23 Update assets only
- [ ] 14.24 animation/timeline preserved
- [ ] 14.25 change Figma layout
- [ ] 14.26 Update layout + assets
- [ ] 14.27 Undo
- [ ] 14.28 Reload
- [ ] 14.29 Persistence
- [ ] 14.30 non-Figma regression
- [ ] 14.31 CI/build
- [ ] 14.32 production deploy
- [ ] 14.33 production smoke
- [ ] 14.34 production browser E2E
- [ ] Gate 14 PASS / RELEASE DONE

## Definition of Done
Figma 4–6 key compositions → layered import → Family Masters → campaign rollout → AI Director → Verification → @1x/@2x + weight validation → Export → Update from Figma without loss of animation/timeline.
