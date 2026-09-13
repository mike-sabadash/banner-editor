# Bannermatic — Figma Creative Workspace technical specification

Status: PLANNING / evidence-based specification  
Date: 2026-09-13  
Implementation target: `mike-sabadash/banner-editor`  
Baseline branch audited: `codex/mvp2-figma-cloud-runtime` / PR #44  

This document is an implementation contract, not a claim that the described runtime is already complete. Product status must always use the chain:

`CODED → TESTED → DEPLOYED → BROWSER RUNTIME VERIFIED → FIGMA RUNTIME VERIFIED → ACCEPTED`.

Green tests, source presence, screenshots, generated previews, or a successful Cloud deployment do not substitute for real Figma Desktop runtime acceptance.

---

# 1. Executive decision

## What we are building

Bannermatic is one campaign-production ecosystem with two deliberately different workspaces:

- **Browser / Cloud = Campaign Control Center** and source of truth for campaign identity, Media Plan, placements, TT, content assignments, versions, compliance and delivery.
- **Figma = Creative Workspace / Creative Provider** and source of truth for editable master artwork, layer structure, assets, composition, animation and designer-owned overrides.

The user journey must feel continuous: create/review Campaign in Cloud → one dominant `Continue in Figma` handoff → continue the same Campaign in the plugin → publish a version → return to the same Cloud Campaign → preview/preflight/delivery.

We are **not** building a second Campaign admin UI inside Figma and **not** building a new browser design editor to replace Figma.

## Reuse / Adapt / Build decision

### REUSE

1. Existing Cloud campaign identity, Media Plan, placement, Content Variant, version, compliance and build models.
2. Existing one-use pairing concept and scoped plugin token; passwords and Cloud user session tokens must never be copied into Figma.
3. Existing Cloud endpoints/contracts as the compatibility baseline: campaign spec, pairing, creative publish, version snapshots.
4. Existing semantic-role metadata concept using Figma plugin data.
5. Existing additive principle: create only missing required visual formats and preserve existing designer work.
6. Figma-native layout primitives wherever they match the problem: Auto Layout, resizing modes, constraints for absolute/ignored children, components, variants, component properties and variables.
7. Existing server-side immutable Creative Version / Media Plan version / TT snapshot / Build pin concepts.

### ADAPT

1. Current plugin root identification and format sync: move from dimension-only heuristics to a stable campaign/format/family identity contract while retaining dimension deduplication at Cloud visual-format level.
2. Current semantic role binding: expand from Headline/Copy/CTA/Legal to a formal role model including Background, Hero/Product, Logo and Decoration; preserve user mapping and never silently remap established roles.
3. Current pairing UI: turn `enter six-digit code` into a visible same-Campaign continuation state with campaign name, required formats, TT summary, progress and recovery.
4. Current format generation: replace placeholder text/rectangle composition with Figma-native template/component structures and explicit family rules. Do not attempt arbitrary layout adaptation before the Research Gate benchmark.
5. Existing publish payload: preserve previews and content variants, but add explicit source revision, override state, semantic manifest and motion metadata required for stale detection and repeat sync.
6. Existing older slot/motion tooling: reuse only behaviors proven compatible with the new contract; do not silently merge legacy assumptions.

### BUILD

Bannermatic-specific value that should not be delegated to generic plugins:

1. Campaign ↔ Figma identity and state machine.
2. Required-format and placement/TT context projection from Cloud into Figma.
3. Stable semantic layer/slot contract.
4. Property-level linked-vs-overridden sync semantics.
5. Missing-format-only creation and re-import reconciliation.
6. Publish/version fingerprinting and stale detection.
7. Adaptation orchestration: deterministic Anchor + restricted AI Delta + deterministic guardrails + `Needs review`.
8. Benchmark/evidence harness proving adaptation quality on Bannermatic campaign cases.

Core principle: **reuse mature layout/editing primitives; build only campaign-production intelligence and contracts unique to Bannermatic.**

---

# 2. Evidence and current-state audit

Sources audited before this specification:

- `docs/CURRENT_CHECKPOINT.md`
- `docs/MVP2_CHECKLIST.md`
- `docs/VNEXT_AUDIT.md`
- `docs/MVP2_STATUS.md`
- PR #44 current metadata and head
- `figma-plugin/mvp2-sync-code.js`
- `figma-plugin/cloud-runtime.js`
- `figma-plugin/cloud-bridge.js`
- `src/mvp2/domain.ts`
- `src/mvp2/api.ts`
- `src/mvp2/FigmaConnectPanel.tsx`
- `server/mvp2Contract.mjs`

Important reconciliation: the PR body still describes verification at older commit `5d754f1f…`, while PR #44 head was newer at audit time. `CURRENT_CHECKPOINT.md` is newer than `MVP2_STATUS.md` and therefore takes priority for current planning, but neither is runtime proof. Runtime status must be rechecked at implementation-session start.

| Capability | Existing code | Runtime verified | Gap | Decision |
| --- | --- | --- | --- | --- |
| Campaign identity in Cloud | `Campaign.id`, server persistence | Cloud API journey previously verified; exact current head must be rechecked | Figma handoff continuity not proven visually | REUSE |
| One-use pairing | `FigmaConnectPanel`, pair endpoints, plugin `pair()` | Browser/Figma combined runtime NOT VERIFIED | Current UX still feels like technical pairing rather than continuous journey | ADAPT |
| Scoped plugin credential | plugin stores `bannermatic:plugin-token` in `figma.clientStorage` | Automated code only | Expiry/revocation/reconnect UX needs runtime proof | REUSE + harden |
| Receive required formats | `figmaSpecFromCampaign`, `/api/figma/campaign`, `formats` | Automated contract evidence only | Plugin status exposes only counts, not full production context | ADAPT |
| Preserve equal-size placement semantics | Cloud `VisualFormat.placementIds` | Cloud tests exist | Plugin stores placement IDs only; TT/delivery context not visibly surfaced | REUSE Cloud, ADAPT projection |
| Missing-format-only sync | `missingCloudFormats`; `syncFromCloud` compares width×height | Automated tests; real Figma NOT VERIFIED | Dimension comparison alone cannot represent future same-size family/source distinctions; no explicit source revision | ADAPT |
| Stable Figma root metadata | shared plugin data: `campaignId`, `formatId`, versions | CODED | No migration/schema version policy; no corruption/recovery UI | ADAPT |
| Generated format structure | `createFormat()` creates `COMPONENT` and placeholder Headline/Copy/CTA/Legal | CODED; syntax/test only | This is a scaffold, not production creative adaptation | REJECT as final UX; retain only as test scaffold |
| Semantic roles | shared plugin data + name aliases | CODED/automated publication test | Only text roles are formal; fallback name guessing can be unsafe | ADAPT to explicit mapping-first model |
| Content variant binding | clone → apply variant → export | Automated evidence | Font failures produce issues, but text fit/wrap/layout quality is not proven | REUSE pipeline, BUILD guardrails |
| Preview publication | SVG export + generated self-contained HTML wrapper | Cloud integration tested | HTML wrapper uses generic stage animation, not verified real Figma motion fidelity | ADAPT; never call generic wrapper motion parity |
| Creative versioning | `applyCreativePublish`, version increments, content fingerprint | Automated/Cloud evidence | Need source/override fingerprints and exact format manifest | REUSE + extend |
| Stale after content change | content fingerprint | Automated evidence | Must extend to media-plan/family/semantic schema changes | ADAPT |
| Manual overrides | older tools and Figma-native instance overrides exist conceptually | New MVP2 runtime NOT VERIFIED | No explicit property-level linked/overridden registry in current MVP2 contract | BUILD |
| Partial sync | historical requirement; not demonstrated in current MVP2 sync | NOT VERIFIED | Current sync updates metadata/missing roots only | BUILD |
| Motion sync | historical plugin tools exist; MVP2 payload mainly tracks duration | NOT VERIFIED | No proven motion contract or property-level preservation | RESEARCH + ADAPT |
| Cloud preview → Preflight → ZIP | server vertical slice exists | Cloud synthetic API runtime was previously verified | Same flow after **real Figma Desktop publish** not verified | First runtime milestone |
| Resize/adaptation quality | current placeholder format generator + older resize experiments | NOT VERIFIED as production quality | No accepted benchmark; prior outputs were visually poor | BASELINE ONLY; Research Gate before new engine |

## What current code proves

It proves there is a meaningful starting contract: Cloud can issue campaign data; the plugin can store a scoped token; roots can carry stable plugin metadata; additive format creation exists; Content Variants can be rendered through semantic roles; SVG/HTML publication can create Cloud creative versions; Cloud can then run compliance/build logic.

## What current code does **not** prove

It does not prove that a normal designer can complete Browser → Figma → Browser without hidden knowledge. It does not prove current format generation is visually acceptable. It does not prove real Figma Desktop behavior for repeat sync, manual overrides, fonts, component-instance overrides, motion, large campaigns or recovery after file/plugin restart. It does not prove generated preview motion matches actual designer animation. These remain explicit acceptance gaps.

---

# 3. Competitive and open-source decision matrix

Research date: 2026-09-13. Only sources that were actually found and inspected are included. Marketing claims are treated as product evidence, not implementation details.

| Solution | Type | What it genuinely solves | License / reuse status | Relevant pattern/code | Limitation for Bannermatic | Reuse / Adapt / Reject |
| --- | --- | --- | --- | --- | --- | --- |
| Figma Auto Layout | Native Figma | Responsive arrangement using direction, gap, padding, alignment, Hug/Fill/Fixed/min/max; nested layouts | Native platform feature | Deterministic responsive containers and typography groups | Graphic ads often require overlap/asymmetry/hero crop; Auto Layout alone is insufficient | REUSE |
| Figma Constraints | Native Figma | Controls how absolute/regular children react to parent resize | Native platform feature | Anchored logos/legal/decorative absolute elements | Does not solve semantic re-composition across extreme ratios | REUSE |
| Figma Components + Variants | Native Figma | Reusable structures with explicit variant properties | Native platform feature | Family templates and structural alternatives | Variant explosion if every size/content combination becomes a variant | REUSE selectively |
| Figma Component Properties / Slots | Native Figma | Exposes intended text/boolean/instance/slot customization; instance overrides persist | Native platform feature | Designer-visible semantic controls and controlled editable regions | Component properties guide but do not enforce campaign semantics by themselves | REUSE |
| Figma Variables | Native Figma | Typed values/modes for dimensions, spacing, typography, strings and modes | Native platform feature | Family tokens, safe-area/padding scales, controlled text/style modes | Not a complete campaign sync/version system | REUSE |
| Figma Plugin API | Native API | Read/write document nodes, plugin data, client storage, export | Figma platform terms | Stable metadata, export, pair/session UI, deterministic node operations | Plugin must implement product contract/recovery; desktop runtime can differ from tests | REUSE |
| Flexlio | Commercial Figma plugin | According to current Figma Forum/Community description: 1–8 approved masters, target sizes, rearrangement rather than simple stretching, editable generated frames, master sync, CSV/Excel media plans, custom sizes, safe zones, A/B variants, naming/filing | Closed/commercial; no code reuse assumed | Strong UX/product benchmark for master → campaign rollout inside Figma | Internal algorithm unavailable; claims require hands-on plugin benchmark before architecture conclusions | ADAPT patterns, no code reuse |
| Bannerflow | Commercial creative automation | Structured master templates, automatic formats/versioning, bulk edits, localization, governed production/publishing | Closed/commercial | Master + locked rules + many versions; automation inside guardrails | Not Figma-native; implementation details proprietary | ADAPT architecture/patterns |
| Celtra Creative Automation / Toolkits | Commercial creative automation | Pre-approved templates, feeds/content dimensions, batch generation across sizes/formats with brand governance | Closed/commercial | Separation of approved template structure from variable campaign content | Not a direct Figma contract; proprietary internals | ADAPT architecture/patterns |
| Creatopy Smart Resize / Design Sets | Commercial ad platform | Multi-size generation, edit multiple sizes as a set, CSV/feed-driven variants, HTML5 export | Closed/commercial | Set-level editing and bulk propagation; visual multi-size workflow | Browser editor model differs from Bannermatic's Figma-provider boundary | ADAPT interaction patterns |
| Tela | Open-source creative canvas | Shared layer model, Figma-style constraints, flexbox-like Auto Layout, multi-format artboards, one-click auto-resize, optional AI relayout endpoint | **MIT** verified in repository LICENSE | Source-level reference for constraints/reflow/data model; legal to reuse with MIT notice | Different canvas/runtime; direct code transplant into Figma may be costly and unnecessary | REUSE selected algorithms/tests; ADAPT concepts |
| Responsify | Open-source Figma plugin source | Clones/tests selected frame/component/instance across multiple device sizes | Figma community index reports **NO LICENSE**; therefore no code reuse without permission | Small technical reference for Plugin API workflow and batch generation | Responsive UI testing, not ad composition; no license | READ/ADAPT concepts only; REJECT code reuse |

## Verified references

- Figma Auto Layout: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout
- Figma variants: https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants
- Figma component properties: https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties
- Figma variables: https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections
- Figma `exportAsync`: https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/
- Flexlio current Figma Forum description: https://forum.figma.com/showcase-your-work-14/i-built-flexlio-to-stop-rebuilding-the-same-campaign-in-endless-sizes-57740
- Bannerflow automated production: https://www.bannerflow.com/use-cases/automated-production
- Bannerflow scaling/versioning: https://www.bannerflow.com/features/ad-versioning
- Celtra Toolkits: https://celtra.com/blog/creative-automation-for-marketing-teams-reimagining-campaign-workflow-with-toolkits/
- Creatopy Smart Resize/design set behavior: https://www.creatopy.com/create/advertisement/
- Tela repository: https://github.com/heyimjames/tela
- Responsify repository: https://github.com/brianlovin/figma-responsify
- Figma community open-source index noting Responsify has no license: https://github.com/figma/community-resources/blob/main/plugins/README.md

## Research conclusion

The market converges on the same principle we should adopt: **an approved/master structure plus explicit guardrails generates/synchronizes many editable outputs; automation handles repetition, not unrestricted creative judgment.** Bannermatic's differentiator is not inventing canvas mechanics. It is connecting real Media Plan/TT/placement/version semantics to this workflow and proving end-to-end delivery.

Open question requiring hands-on evidence before implementation architecture changes: Flexlio's actual layout-rearrangement and sync behavior. The public description is highly relevant, but the internal algorithm is proprietary. The first research/benchmark session should test its playground against Bannermatic's extreme ratios if access permits.

---

# 4. Product architecture

## Ownership boundary

### Cloud owns

- Workspace and Campaign identity.
- Placement identity and provenance.
- Media Plan versions and import diffs.
- Required unique Visual Formats.
- Placement-specific TT and delivery context, including same-size placements with different URLs/tracking/requirements.
- Content Variants and allowed assignments.
- Creative publication versions and stale state.
- Compliance results.
- Delivery Builds and immutable version pins.

### Figma owns

- Master creative nodes and assets.
- Editable composition and layer hierarchy.
- Figma-native components/instances/Auto Layout/constraints/variables.
- Local creative edits.
- Animation authoring supported by the plugin contract.
- Manual overrides.
- The authoritative editable artwork between publications.

### Bannermatic sync layer owns

- Campaign binding metadata.
- Stable format/family/slot/semantic IDs.
- Linked-vs-overridden property registry.
- Diff computation between Cloud intent and Figma state.
- Missing-format creation.
- Explicit, scoped sync operations.
- Publish manifest and fingerprints.

## Campaign identity

A plugin document binds to exactly one active Bannermatic Campaign per connection context unless a future multi-campaign-file feature is explicitly designed.

Required durable metadata at file/page/root level:

- `schemaVersion`
- `campaignId`
- `workspaceId` when available
- `campaignName` for display only, never identity
- `formatId`
- `familyId`
- `sourceMasterId`
- `mediaPlanVersion`
- `ttSnapshotVersion`
- `contentRevision/fingerprint`
- `semanticSchemaVersion`
- `syncRevision`
- `publishedRevision`

IDs, not names or dimensions, are authoritative for sync. Dimensions are validated properties, not identity.

## Pairing

1. Browser requests a short-lived, one-use pairing intent for a specific campaign.
2. Browser displays one dominant `Continue in Figma` action and fallback code instructions.
3. Figma plugin claims the intent and receives a scoped plugin token.
4. Plugin verifies campaign identity before writing document state.
5. Pair code cannot be reused; scoped token can be revoked/expired.
6. Reconnect is explicit and must never silently bind a Figma file to a different campaign.

Deep-linking directly into a Figma plugin/file may be investigated, but the product must remain usable with a pairing-code fallback because Figma/plugin launch capabilities and browser security may vary.

## Required formats and placement/TT context

Cloud spec must send each unique Visual Format once, with its independent placement projections:

```ts
FormatSpec = {
  formatId,
  width,
  height,
  familyId,
  placementIds,
  placementSummaries: [{
    placementId,
    platform,
    placement,
    ttStatus,
    maxZipKb,
    maxDurationSec,
    safeArea?,
    requiredElements?,
    deliveryContextSummary
  }],
  contentAssignments,
  creativeState,
  creativeVersion
}
```

The plugin must show that one `300×250` visual may serve several placements; it must not duplicate creative frames merely because delivery contexts differ.

## Publish

Publish is explicit and versioned. It does not mean "save Figma file".

Publish payload must include:

- Campaign ID and format ID.
- Figma source root ID / stable Bannermatic node ID.
- Semantic manifest.
- Linked/override manifest.
- Content fingerprint.
- Source/sync revision.
- Preview representation(s).
- Supported motion metadata/evidence.
- Production issues detected in plugin.
- Duration/estimated size evidence when trustworthy.

Server validates payload against current Campaign. If Media Plan/content/TT has changed incompatibly since the plugin spec revision, publish returns a conflict requiring refresh/reconcile instead of silently accepting stale creative.

## Versioning and return to Cloud

Successful publish creates immutable Creative Version `N+1`. Browser Campaign Wall refreshes/receives the version, then Cloud recalculates placement-level Preflight against the active Media Plan and TT snapshot. Delivery Build pins Creative + Media Plan + TT versions.

The normal return path is explicit: after publish, plugin shows `Published vN · View in Bannermatic` with the same campaign name. Cloud deep-link target is the campaign Creative/Campaign Wall route, not a generic homepage.

## Error/recovery states

Required recoverable states:

- Pair expired → create new pair intent; no Figma content loss.
- Token revoked → reconnect same campaign; preserve local Figma metadata.
- Campaign changed in Cloud → show diff before sync.
- Newly required format → create only missing format.
- Removed requirement → mark Figma frame `Not required by current plan`; never delete automatically.
- Content changed → mark linked content stale; allow controlled rebind without overwriting manual layout.
- TT changed → update read-only context; never change layout automatically unless user runs an explicit adaptation action.
- Figma format manually deleted → recreate only on explicit `Create missing formats`.
- Duplicate/conflicting Bannermatic metadata → stop write operation and offer repair/choose-root workflow.
- Publish conflict → preserve local work and require refresh/reconcile.

---

# 5. Exact user journey

## Step 1 — Create Campaign

**User sees:** Campaign Control Center with campaign name and clear production steps.  
**Action:** Create/open campaign.  
**Data change:** Cloud Campaign exists with stable `campaignId`.  
**Success:** Campaign route persists/reopens by ID.  
**Errors:** auth/workspace permission/name failure.  
**Recovery:** inline actionable error; no hidden IDs needed.

## Step 2 — Import XLSX

**User sees:** Media Plan import/review, provenance and detected rows.  
**Action:** upload `.xlsx` (primary) or supported fallback input.  
**Data change:** proposed placements + source provenance; no destructive apply before review.  
**Success:** placements, unique format count, TT states and ambiguities visible.  
**Errors:** malformed workbook, unknown dimensions, ambiguous columns, unsupported rows.  
**Recovery:** row-level review/correction; download/sample guidance; re-import diff.

## Step 3 — Review / Compile

**User sees:** placement grid, required unique Visual Formats, TT coverage, content gaps.  
**Action:** confirm reviewed plan.  
**Data change:** Media Plan version increments; Visual Formats compile additively.  
**Success:** explicit `Ready to continue in Figma` when required campaign prerequisites are satisfied.  
**Errors:** unresolved hard ambiguity/invalid dimension.  
**Recovery:** return to exact rows requiring action.

## Step 4 — Continue in Figma

**User sees:** one primary CTA `Continue in Figma`, campaign name, `N formats`, short explanation that creative editing continues in Figma and returns to Bannermatic.  
**Action:** launch/continue pairing.  
**Data change:** short-lived pairing intent only.  
**Success:** plugin claims same `campaignId`; Cloud marks Figma connection state without pretending creative is published.  
**Errors:** pair expiry, plugin unavailable, wrong account/file.  
**Recovery:** regenerate pair code; show exact plugin installation/open instructions; no terminal.

## Step 5 — Pair / receive Campaign

**User sees in plugin:** same campaign name, connection state, `required formats`, `missing`, Media Plan version, TT summary, content summary.  
**Action:** claim pairing or confirm existing connection.  
**Data change:** scoped plugin token in clientStorage; campaign metadata in plugin state.  
**Success:** `Connected · Campaign X` with no hidden developer data.  
**Errors:** invalid code, revoked/expired token, already-bound file to different campaign.  
**Recovery:** retry/reconnect; different-campaign rebinding requires explicit confirmation and must not rewrite existing frames.

## Step 6 — Create only missing formats

**User sees:** `5 required · 3 existing · 2 missing`, list of missing sizes/families and placement counts.  
**Action:** `Create 2 missing formats`.  
**Data change:** only missing Figma roots added; established roots untouched.  
**Success:** exact required set is present; existing manual changes remain byte/document-state equivalent except allowed metadata refresh.  
**Errors:** conflicting duplicate roots, unsupported family template, font/resource issue.  
**Recovery:** conflict inspector; create supported formats and mark unsupported ones `Needs review` rather than generating fake success.

## Step 7 — Edit/link Master

**User sees:** master source status and explicit semantic-role map.  
**Action:** choose/create Master, map required roles, optionally use prepared Bannermatic component/template structure.  
**Data change:** semantic IDs and source-master relation saved in plugin data; no Cloud publication yet.  
**Success:** required roles validated; optional roles classified; document remains normal editable Figma.  
**Errors:** duplicate roles, missing Headline/CTA when required, unreadable font, detached/untraceable source.  
**Recovery:** mapping UI selects real layers; plugin never relies solely on guessed names after a user mapping exists.

## Step 8 — Adapt

**User sees:** target family/format, Anchor result, issues and proposed AI Delta only where enabled.  
**Action:** generate/adapt selected/all missing format(s).  
**Data change:** deterministic transform first; structured deltas second; per-property sync metadata updated.  
**Success:** valid geometry + no hard guardrail failures.  
**Errors:** overflow, unsafe crop, missing legal/logo, unsupported composition, AI timeout/invalid response.  
**Recovery:** keep deterministic Anchor, mark `Needs review`, allow designer correction; AI failure must never destroy Anchor/manual state.

## Step 9 — Partial sync

**User sees:** diff by property: Content, Position, Size, Style, Visibility, Motion, Timing/Easing.  
**Action:** select sync scope and target family/all formats.  
**Data change:** only selected linked properties update.  
**Success:** unselected and overridden properties remain unchanged.  
**Errors:** source layer missing, incompatible target role, unsupported motion property.  
**Recovery:** skip affected property/format, explain why, never fall back to full overwrite.

## Step 10 — Manual override

**User sees:** format state `Linked` / `Partially overridden` and which properties are local.  
**Action:** edit normal Figma properties.  
**Data change:** plugin detects or records local divergence at next reconciliation; user can explicitly `Keep local` or `Relink property`.  
**Success:** repeat sync preserves overridden properties.  
**Errors:** destructive Figma operations may break binding.  
**Recovery:** role/root repair flow; never silently remap to a similarly named layer.

## Step 11 — Publish

**User sees:** changed formats, unresolved issues, exact version to be published.  
**Action:** `Publish Creative`.  
**Data change:** Cloud immutable Creative Version created only for valid touched formats; publication fingerprints persisted.  
**Success:** plugin shows version ID/number and `View in Bannermatic`.  
**Errors:** stale Cloud spec, blocked production issue, network/auth failure.  
**Recovery:** keep local Figma changes; refresh diff; retry idempotently without duplicate versions where request ID repeats.

## Step 12 — Cloud preview

**User sees:** same Campaign, Campaign Wall with published previews by unique Visual Format and placement statuses.  
**Action:** inspect/play previews.  
**Data change:** none unless user changes active version later.  
**Success:** published version is visibly the one from Figma; no fake preview.  
**Errors:** unsupported preview fidelity or export issue.  
**Recovery:** show explicit fallback type and `Open in Figma`; do not label SVG snapshot as live HTML motion.

## Step 13 — Preflight

**User sees:** Ready/Warning/Blocked per placement even when placements share creative dimensions.  
**Action:** resolve issues in Cloud or Figma according to ownership.  
**Data change:** compliance evidence/status.  
**Success:** each failure has exact corrective owner/action.  
**Errors:** missing TT stays Unknown, not invented.  
**Recovery:** TT corrections in Cloud; creative corrections route back to exact Figma format.

## Step 14 — ZIP

**User sees:** Build pins, placement list, version summary.  
**Action:** Build & Download Campaign.  
**Data change:** immutable Build pins Creative + Media Plan + TT snapshot.  
**Success:** placement-specific packages preserve distinct click/tracking contexts while reusing visual creative.  
**Errors:** stale/blocked placements prevent build.  
**Recovery:** link back to exact preflight problem.

---

# 6. Figma state machine

The state machine is user-visible; do not infer completion from code alone.

| State | Source of truth | Enter condition | Allowed primary action | Exit |
| --- | --- | --- | --- | --- |
| `Not connected` | Plugin local state | no valid scoped token/binding | Connect / enter pair code | `Connected` |
| `Ready to continue in Figma` | Cloud | campaign prerequisites met, no valid Figma connection required | Continue in Figma | pairing intent |
| `Connected` | Cloud token validation + plugin binding | scoped token resolves campaign | Load campaign | `Required formats received` |
| `Required formats received` | Cloud spec | current spec loaded | Review/create missing | `Missing formats created` or already complete |
| `Missing formats created` | Figma document + Cloud required set | every supported required format root exists | Link/edit Master | `Master linked` |
| `Master linked` | Figma semantic manifest | source master + required roles known | Adapt/sync/edit | linked/override states |
| `Local override` | Figma document compared with last sync manifest | one or more target properties diverge and are marked local | Keep local / Relink | remains or linked |
| `Changes unpublished` | Figma source revision > published revision | local content/layout/motion changed | Publish | `Published` |
| `Published` | Cloud Creative Version | publish accepted and version created | View in Bannermatic | `Returned to Cloud` |
| `Returned to Cloud` | Cloud route/version | browser opens same campaign/version | Preflight | Ready/Warning/Blocked |
| `Needs review` | Deterministic guardrails / supported AI evidence | non-destructive adaptation cannot guarantee quality | Review in Figma | valid or blocked |
| `Blocked` | Cloud compliance or plugin hard production issue | hard rule failure | Fix at named owner | revalidate |

State naming must be consistent between Browser and plugin. `Connected` is not `Published`; `Formats created` is not `Ready`; `Published` is not `Delivery ready`.

---

# 7. Creative data model and sync contract

## Master

```ts
type CreativeMaster = {
  masterId: string;          // Bannermatic stable ID, not Figma name
  campaignId: string;
  figmaNodeId: string;       // runtime reference, replaceable after repair
  semanticSchemaVersion: number;
  sourceRevision: number;
  roles: RoleBinding[];
  motion?: MotionManifest;
}
```

A Campaign may eventually support several approved masters/concepts, but MVP implementation should prove one master → required format family before generalizing.

## Format family

Family is a composition strategy, not merely a label. Initial classification for benchmark/spec:

- `square-ish`
- `portrait`
- `landscape`
- `ultra-wide-strip`
- `mobile-small-strip`
- optional `fullscreen` later

Cloud may provide a replaceable family classifier, but Figma document metadata stores the family used for the current adaptation so future changes can diff rather than silently reflow.

## Semantic roles

Required canonical roles:

- `background.primary`
- `hero.primary`
- `logo.primary`
- `headline.primary`
- `copy.secondary`
- `cta.primary`
- `cta.background`
- `legal.primary`
- `decoration.*`

Each binding has a stable `slotId` independent of layer name:

```ts
type RoleBinding = {
  slotId: string;
  role: string;
  nodeStableId: string;
  figmaNodeId?: string;
  required: boolean;
  properties: PropertyLinkState;
}
```

Names may assist first-time detection, but once explicitly mapped, layer-name heuristics must not overwrite mapping.

## Linked vs overridden property

Property state is per target slot and per property, not a whole-frame boolean.

```ts
type PropertyLink = {
  mode: 'linked' | 'overridden';
  sourceValueHash: string;
  lastAppliedHash: string;
  localValueHash: string;
  changedAtRevision: number;
}
```

Minimum properties tracked separately:

- content/text
- x/y or Anchor relation
- width/height/scale
- rotation
- opacity
- visibility
- fill/stroke where intentionally linkable
- typography (font family/style/size/line height/letter spacing)
- z-order/group relationship where supported
- motion path/translation
- motion scale/rotation/opacity
- duration/delay
- easing

## Partial sync scope

User may sync:

- selected semantic role(s);
- selected property category/categories;
- one family;
- selected formats;
- all formats.

The operation first produces a diff summary. Applying a sync must update only `linked` properties in chosen scope unless the user explicitly chooses `Overwrite local override` for a named property.

## Properties that must never be silently overwritten

1. Any property marked `overridden`.
2. Designer-authored asset/image replacement.
3. Text edited locally when content binding has been explicitly detached/overridden.
4. Format-specific crop/focal point.
5. Manual position/scale/rotation after it is classified as an override.
6. Motion path/keyframes/easing after local motion override.
7. Hidden/visible state after explicit local visibility override.
8. Layer order/grouping altered locally if the target is no longer structurally equivalent.
9. Unrecognized custom layers (`decoration.custom` or unmapped) unless user explicitly opts them into sync.
10. Existing required format root on Media Plan re-import.

## Repeat sync

Repeat sync computes:

`Cloud/source desired state` vs `last applied source state` vs `current local target state`.

Three-way comparison is required to distinguish:

- source changed, target untouched → safe update;
- source unchanged, target changed → local override;
- both changed → conflict requiring user choice unless property-specific merge is deterministic.

A two-way `copy source to target` algorithm is not acceptable.

## Missing-format-only creation

Required set is keyed by `formatId`; dimensions are validation fields. On sync:

- existing bound `formatId` → update metadata/context only;
- required `formatId` absent → offer creation;
- local bound format no longer required → mark obsolete/not required; never auto-delete;
- duplicate `formatId` roots → conflict repair state.

## Media Plan re-import

Re-import may:

- add placements to existing format;
- add a new visual format;
- remove placements/format requirement;
- alter TT/delivery context while dimensions remain identical.

It must never reset Figma creative. Plugin receives a plan diff summary and only creates newly missing visual formats after user confirmation.

## Stale publication detection

Published format is stale when any production-relevant fingerprint changes after publish, including:

- linked content variant content;
- semantic mapping/schema;
- Figma source revision;
- relevant supported motion manifest;
- required format identity/dimensions;
- source family/adaptation contract if it invalidates output.

TT changes alone do not necessarily make creative stale; they trigger compliance recalculation. If a TT change changes required creative content/safe-area rules, Cloud marks `Needs creative review` with the specific new constraint, not silent layout mutation.

## Version pinning

Publish creates immutable Creative Version. Final Build pins:

- Creative Version
- Media Plan Version
- TT Snapshot Version

A newer Figma publish or plan update must not mutate an old Build.

---

# 8. Adaptation architecture

## Design rule

Do **not** write a new arbitrary layout engine before the Research Gate benchmark. Use a layered architecture in which Figma-native constraints provide the deterministic first pass wherever practical.

## First pass — deterministic Anchor using Figma-native mechanisms

### 1. Prepare semantic/component structure

An approved Master should expose intended editability through components/component properties where practical:

- text properties for Headline/Copy/CTA/Legal;
- boolean properties for optional elements;
- instance/slot properties for swappable hero/product modules where appropriate;
- variants for genuinely different structural states, not every pixel size.

### 2. Use Auto Layout for flowable groups

Appropriate examples:

- Headline + Copy text stack;
- CTA container/label;
- logo + message stack where composition permits;
- legal row;
- grouped text block whose spacing should survive content changes.

Use Hug/Fill/Fixed and min/max dimensions deliberately. Never blanket-convert the entire artwork to Auto Layout.

### 3. Use constraints / ignored-auto-layout absolute children

Appropriate for:

- logo anchored to safe corner;
- decorative layers;
- hero/image focal area;
- legal anchored to bottom/safe zone;
- overlapping composition elements.

### 4. Family-specific deterministic strategy

Each family defines:

- base safe area;
- default anchor zones;
- text-block max width;
- hero crop mode/focal handling;
- allowed optional decoration;
- minimum CTA/logo/legal behavior;
- permissible structural variant.

Extreme ratios should switch family strategy, not extrapolate a single master coordinate transform.

## Second pass — AI-assisted Delta

AI may be used only after deterministic Anchor exists.

### Allowed structured inputs

- Master screenshot.
- Deterministic target screenshot.
- Target width/height/aspect family.
- Semantic role tree and bounds normalized to target.
- Text measurement/overflow facts.
- Allowed property ranges.
- Safe areas.
- Required elements and TT constraints.
- Detected collision/crop/whitespace issues.
- Optional approved reference strategy ID.

### Allowed output

AI returns a schema-validated list of bounded operations, e.g.:

```json
{
  "strategy": "ultra-wide-strip-v1",
  "operations": [
    {"slotId":"headline","op":"move","dxNorm":0.04,"dyNorm":-0.02},
    {"slotId":"headline","op":"fontScale","factor":0.92},
    {"slotId":"hero","op":"cropFocal","xNorm":0.68,"yNorm":0.48},
    {"slotId":"copy","op":"hideOptional"}
  ],
  "confidence": 0.78,
  "reasons": ["headline/hero collision"]
}
```

No unrestricted `x`, `y`, `width`, `height` values. No arbitrary node creation. No deletion of required Logo/CTA/Legal. No direct execution of AI response before schema/range validation.

## Guardrails after AI

Deterministic validator reruns:

- required role presence;
- clipping/overflow;
- text bounding/wrap rules;
- minimum font/CTA/logo sizes;
- legal visibility;
- safe-area containment;
- hero crop/focal constraints;
- collisions on protected regions;
- target dimensions;
- finite geometry;
- supported motion bounds.

If hard constraints fail, reject Delta and keep Anchor or best valid intermediate state.

## Text wrapping

Text is not solved by scaling alone. For each text role define:

- max lines;
- min/max font size;
- width behavior;
- line height range;
- truncation policy (default: forbidden for Headline/Legal unless explicitly allowed);
- preferred wrap points if available;
- whether copy is optional for tiny strips.

## Logo / Legal / CTA rules

- **Logo:** cannot be silently hidden; preserve aspect ratio; min size and safe area; no uncontrolled crop.
- **Legal:** if campaign/content requires it, cannot be hidden; min readable size defined by product/TT policy; if impossible → `Blocked`/`Needs review`.
- **CTA:** preserve readable label and hit/visual size; if placement legitimately has no CTA requirement, visibility is controlled by explicit semantic/property state, not heuristic deletion.

## `Needs review`

Use when valid geometry can be generated but visual quality or semantic correctness cannot be confidently guaranteed. Examples:

- extreme hero crop;
- unresolved headline/hero competition;
- optional content removal required;
- unusual custom layer composition;
- family strategy confidence below threshold;
- manual override conflicts with new source change.

`Needs review` is a valid product state, not an error to hide.

---

# 9. Benchmark before engine work

No claim of adaptation quality without a common visual benchmark.

## 25-case matrix

Choose **5 approved-quality Master creatives** with materially different composition characteristics:

1. `M1 Product-left / copy-right` — hero product, logo, headline, copy, CTA, legal.
2. `M2 Centered hero` — centered product/person with overlaid/stacked typography.
3. `M3 Full-bleed photo + overlay` — focal-point-sensitive image, text on negative space.
4. `M4 Typography-led` — minimal imagery, long/short content variants, strong CTA.
5. `M5 Dense regulated` — logo + hero + headline + CTA + mandatory legal/required elements.

Each is adapted to five target classes/sizes:

| Class | Required benchmark size |
| --- | --- |
| square-ish | `300×250` |
| portrait | `300×600` |
| landscape/social | `1200×628` |
| ultra-wide/strip | `728×90` |
| mobile/small strip | `320×50` |

Total: 25 visual cases.

## Approaches compared on identical cases

A. **Current Bannermatic baseline** — exactly what current plugin/resize logic produces, no manual beautification before scoring.  
B. **Figma-native deterministic prototype** — semantic components + Auto Layout/constraints + family strategy.  
C. **At least one researched alternative/prototype** — e.g. Tela-derived constraint/reflow concepts or verified relevant algorithm.  
D. **AI-assisted Delta on top of B** — only after deterministic result, using bounded schema.

Flexlio may be included as an external product benchmark if the playground/plugin can legally and practically be tested with comparable compositions. Its output cannot be represented as Bannermatic code reuse.

## Scoring rubric

Each case receives 0–2 points per criterion:

- **2 = production-usable without correction**
- **1 = valid but requires small designer correction**
- **0 = broken / major recomposition required**

Criteria (10, max 20/case):

1. Visual hierarchy preserved.
2. No clipping/overflow.
3. Headline/copy readability.
4. Logo preserved and appropriately sized.
5. Legal preserved/readable when required.
6. CTA preserved/readable.
7. Hero crop/focal quality.
8. Safe-area compliance.
9. Composition/negative-space balance.
10. Manual correction effort.

Record separately:

- number of manual corrections;
- correction categories;
- time-to-fix;
- any hidden/removed optional elements;
- deterministic guardrail failures;
- AI invalid-response/rejection rate.

## Measurable exit criteria for choosing Adaptation Engine v2

Research Gate may pass only if:

1. All 25 cases are scored for the current baseline and proposed deterministic approach.
2. Proposed architecture has **zero hard failures** for required Logo/Legal/CTA presence when those roles are required; impossible cases are explicitly `Needs review/Blocked`, never falsely passed.
3. At least **80% of cases score ≥16/20** after deterministic + approved Delta path, with no criterion scored 0 for clipping or required-element loss.
4. At least **60% of cases require zero manual geometry corrections**; remaining cases have quantified correction burden.
5. Ultra-wide `728×90` and small-strip `320×50` each have an explicit family strategy and no silent fallback to uniform scaling.
6. AI schema validation rejection/error cannot corrupt deterministic Anchor; fallback is proven.
7. The team records a `reuse / adapt / build` decision for each selected subsystem before production implementation.

Thresholds may be revised only from recorded benchmark evidence, not because implementation is difficult.

---

# 10. Implementation plan

## Milestone 0 — Real Browser → Figma Runtime Acceptance + Resize Baseline

**This is the next implementation milestone and must happen before new adaptation-engine work.**

### User-visible acceptance scenario

The product owner can, without terminal:

1. Create/open a Campaign in browser on the current test domain.
2. Review/import the Media Plan and reach one clear `Continue in Figma` action.
3. Open the provided Bannermatic development/plugin build in Figma Desktop.
4. Pair and see the same campaign name/identity, required format count and TT/progress context.
5. Receive formats and create/update **only missing** formats.
6. Run the **current** resize/adaptation baseline on 300×250, 300×600, 728×90, 320×50, 1200×628 and record output honestly.
7. Test supported content and motion sync; record unsupported motion instead of faking parity.
8. Publish Creative back to the same Campaign.
9. Open Cloud Campaign Wall, see the actual published preview/version, run Preflight and generate/download ZIP if compliance permits.

### Definition of Done

- `BROWSER RUNTIME VERIFIED`: browser handoff observed on deployed test environment.
- `FIGMA RUNTIME VERIFIED`: plugin loaded and the actual file/document operations executed inside Figma Desktop.
- Campaign identity matches on both sides.
- Existing format/manual edits survive repeat missing-format sync.
- Publish creates one version for the intended campaign without duplicate accidental versions.
- Cloud displays actual publication payload, then uses it for Preflight/Build.
- Baseline screenshots/artifacts saved for five target sizes.
- Known resize/motion limitations written into benchmark evidence.

### Automated checks

- Pair intent is one-use and campaign-scoped.
- Plugin spec schema and migration tests.
- Missing-format reconciliation keyed by format ID.
- No existing target mutation when no safe update is requested.
- Publish conflict/stale-spec test.
- Content variant publication contract.
- Creative Version immutability.
- Same-dimension/multiple-placement delivery context test.

### Manual runtime check

Required in real Figma Desktop. Node/jsdom/unit simulation is insufficient.

### User artifact

Implementation session must end with:

- exact deployed browser URL;
- exact Figma development plugin manifest/build location or installable plugin reference;
- 7–10 step no-terminal test script;
- exact expected labels/states;
- baseline screenshots for five sizes;
- commit/PR head used.

### Not proof of readiness

- green CI alone;
- `node --check`;
- source inspection;
- Cloud API-only acceptance;
- browser screenshots without Figma runtime;
- generated placeholder components;
- mock/fake previews.

---

## Milestone 1 — Stable Figma campaign binding + recovery

### Deliverables

- versioned plugin metadata schema;
- explicit same-Campaign connection UI;
- token expiry/reconnect;
- duplicate metadata detection/repair;
- explicit different-Campaign rebind protection.

### DoD

Restart Figma/plugin, reopen file and recover same Campaign without recreating formats or losing creative.

### Automated

Metadata migration, duplicate binding, token-expiry, pair replay rejection.

### Manual

Quit/reopen Figma Desktop and repeat sync.

### User artifact

Plugin build + recovery scenario.

### Not proof

Unit state-machine tests without file reopen.

---

## Milestone 2 — Semantic Master and role binding

### Deliverables

- explicit role mapper;
- stable `slotId`;
- Headline/Copy/CTA/Legal + Logo/Hero/Background roles;
- required/optional validation;
- name aliases used only as first-time suggestions.

### DoD

User can map a real Master with arbitrary layer names, rename layers, restart plugin and retain bindings.

### Automated

Role manifest validation and persistence.

### Manual

Real master with nested groups/components and non-English layer names.

### User artifact

Sample Master + mapping checklist.

---

## Milestone 3 — Three-way partial sync + manual override preservation

### Deliverables

- per-property linked/overridden registry;
- source/last-applied/local hashes;
- diff UI;
- selected-property/family/format sync;
- explicit relink/overwrite-local actions.

### DoD

A manual x/y/scale/text/motion override survives unrelated repeat sync; a linked property updates; true conflicts require user choice.

### Automated

Three-way merge matrix tests per supported property.

### Manual

Edit several target formats directly in Figma, sync twice, inspect values.

### User artifact

Override-preservation test file and script.

### Not proof

Whole-node clone/copy that happens to look correct once.

---

## Milestone 4 — Figma-native deterministic Anchor prototype

### Deliverables

- family template/components;
- Auto Layout/constraints strategy;
- text-fit guardrails;
- safe zones;
- deterministic adaptation for benchmark formats.

### DoD

25 benchmark Anchors generated and scored before AI Delta.

### Automated

Geometry/finite bounds/role-presence/text-overflow tests where deterministic measurement is reliable.

### Manual

Visual scoring with saved screenshots.

### User artifact

Benchmark contact sheet/report.

### Not proof

Average unit-test pass rate or three cherry-picked good formats.

---

## Milestone 5 — Research Gate decision

### Deliverables

- comparative benchmark current vs native vs researched alternative(s);
- hands-on Flexlio notes if accessible;
- Tela code/algorithm reuse candidates with MIT attribution plan;
- final Adaptation Engine v2 ADR (`reuse/adapt/build`).

### DoD

Exit criteria in Section 9 met or architecture remains blocked with explicit evidence.

### Not proof

Competitor marketing claims alone.

---

## Milestone 6 — AI-assisted Delta + guardrails

Only after Milestone 5 passes.

### Deliverables

- strict Delta schema;
- bounded normalized operations;
- AI Router adapter;
- deterministic validation/fallback;
- `Needs review` and confidence evidence.

### DoD

Benchmark improvement is measurable and no AI failure can damage the deterministic Anchor or manual source.

### Automated

Schema fuzz/invalid responses/timeouts/range limits/idempotency.

### Manual

Compare target screenshots and accepted/rejected Delta traces.

---

## Milestone 7 — Production publish contract v2

### Deliverables

- semantic/override/motion/source revision manifests;
- stale conflict handling;
- idempotent publish request IDs;
- exact Campaign Wall route/version return.

### DoD

Figma publish → Cloud preview → Preflight → ZIP repeated across content and plan revisions without lost overrides or placement context.

---

# 11. Explicit non-goals and risks

## Non-goals for the next implementation stage

- **Do not build a new layout engine before the Research Gate.**
- Do not move campaign planning/TT/compliance/delivery ownership into Figma.
- Do not replace Figma with a Cloud editor.
- Do not rebuild generic Figma canvas features (selection, typography editor, transform handles, layer panel) in Bannermatic.
- Do not promise arbitrary PSD/Figma composition adaptation.
- Do not create one permanent Figma frame for every `(placement × content variant)` deliverable; visual formats remain deduplicated where appropriate.
- Do not make AI the source of absolute pixel geometry.
- Do not auto-delete obsolete Figma roots after Media Plan changes.
- Do not auto-overwrite manual overrides.
- Do not treat snapshot SVG or generic generated HTML animation as proven Figma motion fidelity.

## Critical risks

### R1 — Runtime illusion

**Risk:** code/tests look complete while Figma Desktop flow is broken.  
**Mitigation:** separate status labels and mandatory real runtime milestone first.

### R2 — Destructive sync

**Risk:** repeat sync overwrites designer corrections.  
**Mitigation:** three-way per-property link state; no implicit full overwrite.

### R3 — Same dimensions, different delivery context

**Risk:** two placements collapse semantically because they share 300×250.  
**Mitigation:** one Visual Format may serve many Placement IDs; TT/click/tracking remain placement-owned in Cloud and are never inferred from format alone.

### R4 — Auto Layout overreach

**Risk:** responsive UI mechanics are mistaken for graphic composition intelligence.  
**Mitigation:** family strategies + constraints + protected absolute elements + benchmark.

### R5 — AI pixel hallucination

**Risk:** LLM produces unstable absolute geometry.  
**Mitigation:** Anchor first; bounded normalized Delta schema; deterministic post-validation and fallback.

### R6 — Semantic binding fragility

**Risk:** name-based linking breaks on rename/nesting.  
**Mitigation:** stable slot IDs/plugin data; names only first-time suggestions.

### R7 — Motion mismatch

**Risk:** Cloud preview claims motion that plugin did not faithfully export.  
**Mitigation:** define supported motion subset and explicit fallback/unsupported state; benchmark real runtime.

### R8 — Font/text measurement mismatch

**Risk:** local Figma fonts, missing fonts or content length break layout.  
**Mitigation:** font-loading evidence, deterministic text-fit rules, `Needs review` on unavailable fonts.

### R9 — Proprietary/open-source misuse

**Risk:** copying proprietary competitor behavior/code or unlicensed source.  
**Mitigation:** competitor products are patterns only; Tela code can be reused under MIT with notice; Responsify is reference-only unless permission/license changes.

### R10 — Fake previews/statuses

**Risk:** user sees `Ready` based on metadata rather than output evidence.  
**Mitigation:** readiness derives from actual publication/preflight evidence; Unknown remains Unknown.

### R11 — Benchmark gaming

**Risk:** selecting only easy masters/formats creates false confidence.  
**Mitigation:** fixed 5×5 matrix includes dense/regulated and extreme-ratio cases, baseline saved before engine changes.

---

# Open questions that must remain explicit

1. Can Flexlio's current playground be tested with sufficiently comparable campaign art and extreme formats? Public evidence confirms the workflow, not its algorithm.
2. Which exact Figma motion properties can be exported/preserved reliably in our HTML5 production pipeline? Current MVP2 code does not prove this.
3. Should the first production Master be a Figma Component, Component Set, or normal Frame with a semantic manifest? Benchmark/runtime evidence should decide; do not force componentization on arbitrary artwork prematurely.
4. Which Figma node ID/stable plugin-data repair strategy survives copy/paste, duplicate, detach and cross-page moves best? Needs a runtime experiment.
5. What minimum readable Legal font size is globally safe? This is TT/client-dependent; the system must not invent one universal regulatory value.
6. Whether direct browser → plugin deep-link can reliably replace pairing code across supported Figma environments. Pairing code remains required fallback until proven.
7. Exact OpenRouter model and paid-call policy for adaptation Delta. Model choice must be benchmarked; do not hardcode a vendor/model as architecture.

---

# Final implementation rule

The next implementation session does **not** begin by improving resize quality.

It begins with **`Real Browser → Figma Runtime Acceptance + Resize Baseline`**. First prove that the same real Campaign can travel Browser → Figma → Browser, that only missing formats are created, that repeat sync does not destroy existing work, and that a real Figma publication reaches Cloud Preflight/ZIP. Save the current five-format resize output as the baseline.

Only then proceed to semantic/override hardening and the Creative Adaptation Research Gate. A new adaptation engine is permitted only after the 25-case benchmark produces an evidence-backed `reuse / adapt / build` decision.
