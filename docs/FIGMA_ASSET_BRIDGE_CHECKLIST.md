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
- [ ] 1.1 exportScale 1|2 per format
- [ ] 1.2 default @1x
- [ ] 1.3 Media Plan/TT can set @2x
- [ ] 1.4 maxBytes
- [ ] 1.5 export type HTML5/JPG/PNG/WebP
- [ ] 1.6 separate logical and physical export size
- [ ] 1.7 200×300 @2x remains 200×300 editor canvas
- [ ] 1.8 physical export becomes 400×600
- [ ] 1.9 advanced manual scale override
- [ ] 1.10 mark override as manual
- [ ] 1.11 @2x badge
- [ ] 1.12 weight-limit badge
- [ ] 1.13 export-type badge
- [ ] 1.14 preserve MASTER/AUTO
- [ ] 1.15 compact badge UX
- [ ] 1.16 campaign summary N formats require @2x
- [ ] 1.17 summary filters/highlights formats
- [ ] Gate 1 PASS

## Phase 2 — Asset Quality / Density Engine
- [ ] 2.1 sourceWidth/sourceHeight
- [ ] 2.2 placed physical size
- [ ] 2.3 effective source density
- [ ] 2.4 400×600→200×300 = 2×
- [ ] 2.5 300×450→200×300 = 1.5×
- [ ] 2.6 200×300→200×300 = 1×
- [ ] 2.7 compare density with required exportScale
- [ ] 2.8 OK state
- [ ] 2.9 Warning state
- [ ] 2.10 Insufficient state
- [ ] 2.11 source resolution never changes visual object size
- [ ] 2.12 Asset Quality Inspector
- [ ] 2.13 source/placed/required display
- [ ] 2.14 per-format warning
- [ ] 2.15 campaign insufficient-assets list
- [ ] Gate 2 PASS

## Phase 3 — Figma Connection
- [ ] 3.1 server-side Figma integration
- [ ] 3.2 no credentials in frontend
- [ ] 3.3 secure credential storage
- [ ] 3.4 figma/status endpoint
- [ ] 3.5 connect/reconnect
- [ ] 3.6 disconnect
- [ ] 3.7 expired/revoked token handling
- [ ] 3.8 listFiles
- [ ] 3.9 getFile
- [ ] 3.10 pages
- [ ] 3.11 frames
- [ ] 3.12 getNodes
- [ ] 3.13 exportNodes
- [ ] 3.14 getVersion
- [ ] 3.15 timeouts/retries
- [ ] 3.16 rate-limit handling
- [ ] Gate 3 PASS

## Phase 4 — Figma Browser + Frame Detection
- [ ] 4.1 Import design entry point
- [ ] 4.2 source picker
- [ ] 4.3 Figma source
- [ ] 4.4 file picker
- [ ] 4.5 page picker
- [ ] 4.6 frame browser
- [ ] 4.7 frame preview
- [ ] 4.8 read actual dimensions
- [ ] 4.9 exact campaign-format match
- [ ] 4.10 frame name secondary signal
- [ ] 4.11 META_300x600_V1 → 300×600
- [ ] 4.12 multiple frame matches
- [ ] 4.13 duplicate-size handling
- [ ] 4.14 nearest family suggestion
- [ ] 4.15 no automatic nearest apply
- [ ] 4.16 multi-select
- [ ] 4.17 mapping preview
- [ ] Gate 4 PASS

## Phase 5 — Figma Layer Normalization
- [ ] 5.1 parse node tree
- [ ] 5.2 TEXT → editable text
- [ ] 5.3 IMAGE fill → AssetSource
- [ ] 5.4 simple VECTOR
- [ ] 5.5 RECTANGLE
- [ ] 5.6 ELLIPSE
- [ ] 5.7 groups
- [ ] 5.8 nested frames
- [ ] 5.9 masks
- [ ] 5.10 effects
- [ ] 5.11 blend modes
- [ ] 5.12 unsupported → visual fallback
- [ ] 5.13 preserve visual fidelity in fallback
- [ ] 5.14 no Figma Auto Layout runtime
- [ ] 5.15 no component/variable/plugin runtime dependency
- [ ] 5.16 z-order
- [ ] 5.17 opacity
- [ ] 5.18 crop
- [ ] 5.19 rotation
- [ ] 5.20 frame-relative geometry
- [ ] Gate 5 PASS

## Phase 6 — Semantic Layer Mapper
- [ ] 6.1 normalize names
- [ ] 6.2 background aliases
- [ ] 6.3 product/hero
- [ ] 6.4 logo/brand
- [ ] 6.5 headline/title
- [ ] 6.6 cta/button
- [ ] 6.7 legal/disclaimer
- [ ] 6.8 decor
- [ ] 6.9 node type signal
- [ ] 6.10 position signal
- [ ] 6.11 relative-size signal
- [ ] 6.12 confidence
- [ ] 6.13 deterministic mapping priority
- [ ] 6.14 AI only for ambiguous layers
- [ ] 6.15 minimize AI payload
- [ ] 6.16 rule/AI/user provenance
- [ ] 6.17 Semantic Role Review UI
- [ ] 6.18 unknown layers visible
- [ ] 6.19 manual correction
- [ ] 6.20 persist correction
- [ ] Gate 6 PASS

## Phase 7 — Import Plan
- [ ] 7.1 read-only ImportPlan
- [ ] 7.2 no campaign mutation during plan
- [ ] 7.3 selected frames
- [ ] 7.4 target formats
- [ ] 7.5 layer count
- [ ] 7.6 semantic roles
- [ ] 7.7 unknown layers
- [ ] 7.8 unsupported effects
- [ ] 7.9 source-resolution warnings
- [ ] 7.10 conflicts
- [ ] 7.11 result preview
- [ ] 7.12 batch import CTA
- [ ] Gate 7 PASS

## Phase 8 — Apply Import
- [ ] 8.1 Undo checkpoint
- [ ] 8.2 materialize assets into Bannermatic storage
- [ ] 8.3 no runtime Figma CDN dependency
- [ ] 8.4 AssetSource records
- [ ] 8.5 SceneLayers
- [ ] 8.6 provenance
- [ ] 8.7 fingerprints
- [ ] 8.8 node IDs
- [ ] 8.9 single-frame import
- [ ] 8.10 multi-frame batch
- [ ] 8.11 4–6 key compositions
- [ ] 8.12 preserve scenes
- [ ] 8.13 preserve timeline
- [ ] 8.14 preserve animation
- [ ] 8.15 undo full import
- [ ] 8.16 retry without duplicates
- [ ] Gate 8 PASS

## Phase 9 — Responsive Masters handoff
- [ ] 9.1 imported exact formats → Family Master candidates
- [ ] 9.2 Use as Family Master
- [ ] 9.3 geometry family
- [ ] 9.4 master snapshot
- [ ] 9.5 intermediate rollout
- [ ] 9.6 override precedence
- [ ] 9.7 no parallel Figma inheritance
- [ ] 9.8 portrait
- [ ] 9.9 tall
- [ ] 9.10 rectangle
- [ ] 9.11 wide
- [ ] 9.12 strip
- [ ] 9.13 micro-strip
- [ ] 9.14 extreme formats
- [ ] 9.15 MASTER/AUTO wall status
- [ ] 9.16 4–6 masters cover campaign
- [ ] Gate 9 PASS

## Phase 10 — Update from Figma
- [ ] 10.1 Update from Figma action
- [ ] 10.2 version check
- [ ] 10.3 fingerprint comparison
- [ ] 10.4 added
- [ ] 10.5 removed
- [ ] 10.6 asset changed
- [ ] 10.7 geometry changed
- [ ] 10.8 text changed
- [ ] 10.9 unchanged
- [ ] 10.10 diff UI
- [ ] 10.11 default assets-only
- [ ] 10.12 explicit layout+assets
- [ ] 10.13 preserve animation
- [ ] 10.14 preserve timeline
- [ ] 10.15 preserve semantic role
- [ ] 10.16 preserve local corrections for assets-only
- [ ] 10.17 conflict detection
- [ ] 10.18 no silent deletion
- [ ] 10.19 checkpoint
- [ ] 10.20 undo update
- [ ] Gate 10 PASS

## Phase 11 — Export Optimizer
- [ ] 11.1 physicalWidth = logicalWidth × exportScale
- [ ] 11.2 physicalHeight
- [ ] 11.3 required raster resolution per layer
- [ ] 11.4 crop
- [ ] 11.5 resize
- [ ] 11.6 preserve SVG
- [ ] 11.7 preserve text/vector where possible
- [ ] 11.8 JPG
- [ ] 11.9 PNG
- [ ] 11.10 WebP
- [ ] 11.11 HTML5
- [ ] 11.12 maxBytes
- [ ] 11.13 bounded quality search
- [ ] 11.14 layer-aware optimization
- [ ] 11.15 background compression priority
- [ ] 11.16 product quality priority
- [ ] 11.17 logo vector priority
- [ ] 11.18 blocking impossible-limit warning
- [ ] 11.19 no silent quality degradation
- [ ] 11.20 diagnostics
- [ ] Gate 11 PASS

## Phase 12 — AI Director integration
- [ ] 12.1 FormatSpec context
- [ ] 12.2 resolved layouts
- [ ] 12.3 exportScale context
- [ ] 12.4 maxBytes context
- [ ] 12.5 density warnings
- [ ] 12.6 AI cannot invent/change @2x
- [ ] 12.7 layout correction
- [ ] 12.8 optional decor/copy suppression
- [ ] 12.9 semantic roles
- [ ] 12.10 Verification Pass
- [ ] 12.11 Layout warnings
- [ ] 12.12 Asset Quality warnings
- [ ] 12.13 Export Requirement warnings
- [ ] 12.14 warning → format/layer navigation
- [ ] Gate 12 PASS

## Phase 13 — Security & production hardening
- [ ] 13.1 encrypted credentials
- [ ] 13.2 no token in client/localStorage
- [ ] 13.3 MIME validation
- [ ] 13.4 SVG sanitization
- [ ] 13.5 file-size limits
- [ ] 13.6 node-count limits
- [ ] 13.7 concurrent-import limits
- [ ] 13.8 timeout handling
- [ ] 13.9 rate-limit handling
- [ ] 13.10 expired/revoked auth
- [ ] 13.11 deleted Figma file
- [ ] 13.12 deleted node
- [ ] 13.13 renamed node
- [ ] 13.14 large-document stress
- [ ] 13.15 import telemetry
- [ ] 13.16 unknown-role metric
- [ ] 13.17 conflict metric
- [ ] 13.18 export-failure metric
- [ ] Gate 13 PASS

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
