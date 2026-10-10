# Bannermatic / ResizeLab — current project status

Updated: 2026-10-10 (GitHub audit; deployment not checked)

## Sources of truth
- Repo: `mike-sabadash/banner-editor`.
- Main at start of audit: `d293068bea8783ab18f9476e4ca485b419187be2` (subsequently documentation commit added).
- Historic ResizeLab preview branch: `experiment/ai-resize-lab-20261001` (head `8972fcc8`, dated Oct 1; **not the latest feature branch**).
- Newer feature branches: `feature/resize-lab-assets-motion-20261010`, `feature/resize-lab-typography-cta-20261010`, `feature/resize-lab-persistence-current-20261010`.
- Previously identified server path: `/var/www/banner-resize-lab`; services `banner-resize-lab.service`, `banner-resize-lab-api.service`. These are **historical operational notes, not verified in this audit**.

## Latest known work
- Image-logo upload/replacement and inherited animation presets: code commit `1ac5b527` on assets-motion branch.
- Typography scaling, color controls and CTA variants: code commit `1a59c593` on typography-cta branch; Google Font preview fixes follow.
- Canvas drag positions independent of animation keyframes: main commit `d293068`.
- Persistence/login/autosave changes: `708d48e`, `a2cd6d7`, `dfc2816` on persistence-current branch.
- User also reports button corner-radius/color editing and per-format text movement; exact code location, merge and deployment require further verification.

## Critical caveat
The branch heads differ. Do **not** treat all changes as present together on `main` or on the server without checking merge ancestry and the deployed SHA. The older `experiment/ai-resize-lab-20261001` branch is not sufficient as a current source baseline.

## Next verification before any product edit/deploy
1. Determine the server checkout branch and SHA in `/var/www/banner-resize-lab` and compare to GitHub.
2. Verify the actual button radius/color controls, text position overrides, logo replacement and inherited animation in the running UI.
3. Reconcile newer feature branches with the deployed code without overwriting unmerged work.
4. Run tests and inspect deployment workflows; record exact deploy result in `CHANGELOG.md`.

## Logging policy
For **every** commit and **every** deployment, update `CHANGELOG.md`; after deploy update this status with deployed SHA, service, verification and rollback SHA. Documentation-only commits must not be represented as deployments.
