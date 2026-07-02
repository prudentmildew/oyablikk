# GitHub Pages deploy: subpath today, portable paths for tomorrow

_Adopted from tonsoclock ADR-0009. The two-workflow, portable-paths architecture is unchanged; the repo and Pages site are new. **Amended by [0020](./0020-single-script-pipeline.md)**: the workflows link via `workflow_call`, not `workflow_run` + SHA gate._

Ship Øyablikk to GitHub Pages at `https://prudentmildew.github.io/oyablikk/` and keep every URL in the build relative, so a later move to a custom domain ([0015](./0015-custom-domain-apex-no-cname-file.md)) is zero-config. Wire two single-responsibility workflows — `nightly-refresh.yml` for data, `deploy.yml` for shipping.

Portability is enforced in three places: `base: './'` in `vite.config.ts`, relative `href`s for `./manifest.webmanifest` and `./apple-touch-icon.png` in `index.html`, and `start_url: "."`, `scope: "."`, and `./…` icon `src`s in the manifest. The manifest `id` stays `"/"` (a stable identifier; a relative value would lock app identity to whichever URL the user first installed from).

**Linking (amended):** `deploy.yml` is a **reusable workflow** — triggered by `push: main` (human commits) and by `workflow_call`. The nightly runs the fetch script; when it actually commits fresh data it pushes and calls deploy directly as a dependent job. Tonsoclock's `workflow_run` + SHA-comparison gate existed only because `GITHUB_TOKEN` pushes don't trigger downstream `push:` workflows, forcing the deploy to *infer* whether the nightly committed; calling deploy from the branch that just committed states it instead. The nightly also carries a `concurrency:` group and a `workflow_dispatch` trigger ([0020](./0020-single-script-pipeline.md)).

## Considered options

- **Custom domain from day one.** Rejected: the subpath is free and [0015](./0015-custom-domain-apex-no-cname-file.md) makes the eventual migration cheap. (For Øyablikk the domain is still an open question — PRD §10.1.)
- **One workflow combining refresh and deploy.** Rejected in favour of single-responsibility files.
- **`workflow_run` + SHA gate (tonsoclock's mechanism).** Rejected for Øyablikk: proven in production there, but the SHA guard's only job is inferring what the nightly already knows. `workflow_call` removes the event plumbing and the gate.

## Consequences

- Repo Settings → Pages → Source must be set to "GitHub Actions" by hand before any deploy can succeed. Not enforceable from code.
- Users who install the PWA at the subpath will need to reinstall after a custom-domain migration — browsers treat the two origins as different apps.
