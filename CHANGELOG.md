# Resize Lab changes

## 2026-10-10 — Diffusion UI review

- Base: production integration fc2111f; branch fix/resize-lab-diffusion-ui-20261010.
- Preserve MVP-2 master and derived card workflow. Adapt Diffusion dark tokens, local Inter font, 28px controls, compact fields, sliders and section rhythm to React.
- Pair existing ranges with precise numeric inputs; keep inheritance handlers.
- Include account row in bounded viewport with independent panel scrolling.
- Local build and 381 tests pass. Browser download is corrupt locally; PR workflow verifies editing and captures UI screenshot. No production deployment.
- Earlier release history is in main's CHANGELOG.md and the repository commit history.

## 2026-10-10 — deployment and visual verification
- 9f8ef7a: UI changes; merged via PR #127 to 662b4ce.
- Deploy workflow 38073868751 completed successfully, including production browser scenarios; live CSS contains Diffusion tokens and controls.
- aa10e53: use compiled preview in UI checks; e8942c0: account for editing mode reset on reload.
- Workflow 38074135575 passed editing, family inheritance, numeric input and viewport checks; screenshot inspected.
- Visual follow-up: put local property labels, sliders and values on one baseline; prevent native number spinner from clipping values. Pending follow-up deploy.
