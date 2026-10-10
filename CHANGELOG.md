# Bannermatic / ResizeLab — changelog

## 2026-10-10 — Baseline reconstruction (documentation only)

**Important:** GitHub branch history is not proof of production deployment. Every future entry must record exact commit SHA, branch, tests, deployment target, deployed SHA, verification URL and outcome. Do not label a feature live without deployment verification.

### Verified in GitHub history
- `main` HEAD at inspection: `d293068bea8783ab18f9476e4ca485b419187be2` — persist canvas drag positions without animation keyframes (#122), 2026-10-10 13:09 UTC.
- `feature/resize-lab-assets-motion-20261010`: `1ac5b5276da7aef76b036ed5c2ff2be943e1c2a8` — image logos and inherited animation presets; head `003c03a287e3df5db2b298d3a775c170b2cf8233` — CI validation.
- `feature/resize-lab-typography-cta-20261010`: `1a59c593f82f2d4a1999a61abfafa90054ebc795` — typography scale, color controls and CTA variants; `a8ac18892ca6bb6be6def30a69296db525866344` — Google Font loading; head `6b6c336a38bdb63241c60c406ae7516f09253ee` — standalone preview font fix.
- `feature/resize-lab-persistence-current-20261010`: `708d48e79ae86eaab8eb6e1cf43d2b81e82c3d69` — retain login; `a2cd6d75a8417069d4cd70e615aa5fb62b846043` — per-user project isolation; head `dfc2816ba0c27df11aae977d1dfbcfc48f599343` — serialized autosave.
- `experiment/ai-resize-lab-20261001` head `8972fcc8ca48586bea29116a00c4b678060c6866` — proxy Resize Lab API in preview; **older than feature branches**.

### Reported by user, awaiting exact code/deploy mapping
- Button editing: corner radius and color.
- Text movement/position adjustments across resized formats.
- Replace logo by choosing/uploading an image file.
- Animation controls and propagation.

These are reported as implemented in a previous session, but **their exact deployed versions are not yet verified**. Do not discard or overwrite them.

### Mandatory workflow from now on
1. Before changes, record repository, branch, HEAD SHA, target server/service, and baseline behavior.
2. Each code commit: add dated entry with commit SHA (or PR link), feature/fix, affected files, tests, regressions, and status. Prefer the same PR; update SHA after merge.
3. Each deploy: record source SHA, server directory, systemd services, workflow/run, timestamp, health/functional checks, rollback reference, and success/failure.
4. Keep ResizeLab, Studio, and portfolio deployment targets distinct; never infer deployment from a merge or active service.
5. Update `PROJECT_STATUS.md` after each release and consult it before any new session.

## Deployment log
- 2026-10-10: **No deployment performed or independently verified in this documentation pass.**
