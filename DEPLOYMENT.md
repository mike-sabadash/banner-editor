# Bannermatic — deployment runbook (verified 2026-10-10)

This is the source of truth for **how to investigate and deploy** Bannermatic Studio. Read this file and `AGENTS.md` before asking the owner for SSH access, new keys, or manual terminal commands.

## Verified deployment route

- GitHub repository: `mike-sabadash/banner-editor`.
- Studio integration / auto-deploy branch: `feature/diffusion-editor-upstream`.
- GitHub Actions workflow: `.github/workflows/deploy-diffusion-upstream.yml` (workflow name: `Vendor and Deploy Diffusion Studio Upstream`).
- GitHub Actions secret **name**: `BANNERMATIC_SERVER_SSH_KEY`. Never print, copy into issues, or ask the user to paste the private key.
- Server: `213.182.208.29`; SSH port `2222`. GitHub Actions connects to the server; the server's separate deploy key at `/root/.ssh/banner_editor_deploy` authenticates server → GitHub over `ssh.github.com:443`.
- Verified successful run: [37975797483](https://github.com/mike-sabadash/banner-editor/actions/runs/37975797483). All steps passed, including checking the secret, configuring SSH, uploading Studio release, restarting Campaign API/gateway, public smoke checks and browser interaction smoke test.
- Other recent runs (from public GitHub API, checked 2026-10-10): 37971838981 success; 37955248297 success; 37955109772 failure; 37954458074 success.
- Public endpoints returned HTTP 200 on 2026-10-10: `https://studio.bannermatic.online/`, `https://resize-lab.bannermatic.online/`, `https://bannermatic.online/`. HTTP 200 alone does not prove the latest code is live.

## Server layout — do not confuse projects

- `/var/www/banner-editor`: Studio integration checkout; observed branch `feature/diffusion-editor-upstream`.
- `/var/www/banner-resize-lab`: Resize Lab, separate checkout/service; observed branch `experiment/ai-resize-lab-20261001`.
- `/var/www/bannermatic`: portfolio static site; **not** a Git checkout.
- `banner-resize-lab.service` and `banner-resize-lab-api.service` serve Resize Lab; do not restart or reconfigure them as a side effect of Studio work.
- Portfolio source is separate repository `mike-sabadash/bannermatic-site`; the Studio workflow is **not** evidence of a working portfolio deployment route.
- The Studio workflow may change Nginx configuration: review it carefully before triggering, especially its interaction with Resize Lab. Never assume that a Studio deployment publishes Resize Lab or portfolio.

## Workflow for future agents

1. Identify the target product: Studio, Resize Lab or portfolio. Confirm its repo, branch, build output and service before changing anything.
2. Read `AGENTS.md`, this runbook and the **current** workflow source. Check latest GitHub Actions runs and relevant job steps before asserting that deploy access is broken.
3. Work on a separate branch; run relevant checks; open a PR. Do not change production simply to test connectivity.
4. Obtain the owner's approval before a production release. Once approved, use the existing auto-deploy route for Studio, then inspect the actual run result and validate the exact published version and relevant user scenario.
5. Report separately: code committed, PR merged, workflow successful, and live site verified. Do not claim deployment based only on an HTTP 200 response.
6. If the connector cannot trigger workflows directly, a merge/push into the configured branch may trigger GitHub Actions; do not request new SSH keys as a workaround. If any required action is blocked, state precisely what was blocked.

## Safe checks

- [Studio workflow runs](https://github.com/mike-sabadash/banner-editor/actions/workflows/deploy-diffusion-upstream.yml)
- [Verified successful run](https://github.com/mike-sabadash/banner-editor/actions/runs/37975797483)
- Public GitHub API: `https://api.github.com/repos/mike-sabadash/banner-editor/actions/runs?per_page=5`
- Check the **job steps**, not just the run conclusion, and check that the run corresponds to the intended commit.
- Do not confuse server → GitHub authentication with GitHub Actions → server authentication. The successful workflow job confirms the latter for that run.

## Security and scope

Do not paste private keys, tokens, `.env` contents or GitHub Actions secrets into chat, logs, PRs or documentation. Do not change other VPS projects or unrelated Nginx sites. Keep backups and a rollback plan for actual production changes.

_Last verified: 2026-10-10. Re-check current workflow and server state before relying on historical details._
