# GitHub Pages deploy: subpath today, portable paths for tomorrow

_Adopted from tonsoclock ADR-0009. The two-workflow, portable-paths architecture is unchanged; the repo and Pages site are new._

Ship Øyablikk to GitHub Pages at `https://prudentmildew.github.io/oyablikk/` and keep every URL in the build relative, so a later move to a custom domain ([0015](./0015-custom-domain-apex-no-cname-file.md)) is zero-config. Wire two single-responsibility workflows — `nightly-refresh.yml` for data, `deploy.yml` for shipping — and link them with `workflow_run` plus a SHA-comparison gate so no-op nights don't trigger redundant deploys.

Portability is enforced in three places: `base: './'` in `vite.config.ts`, relative `href`s for `./manifest.webmanifest` and `./apple-touch-icon.png` in `index.html`, and `start_url: "."`, `scope: "."`, and `./…` icon `src`s in the manifest. The manifest `id` stays `"/"` (a stable identifier; a relative value would lock app identity to whichever URL the user first installed from).

The `workflow_run` link is required because pushes authored by `GITHUB_TOKEN` (what the nightly does when it commits refreshed data) do not, by design, trigger downstream `push:` workflows. The deploy job guards on `conclusion == 'success' && head_sha != github.sha` so it only ships when the nightly actually committed.

## Considered options

- **Custom domain from day one.** Rejected: the subpath is free and [0015](./0015-custom-domain-apex-no-cname-file.md) makes the eventual migration cheap. (For Øyablikk the domain is still an open question — PRD §10.1.)
- **One workflow combining refresh and deploy.** Rejected in favour of single-responsibility files.
- **`workflow_run` without a SHA gate.** Rejected: every no-op nightly would trigger a redundant rebuild and deploy.

## Consequences

- Repo Settings → Pages → Source must be set to "GitHub Actions" by hand before any deploy can succeed. Not enforceable from code.
- Users who install the PWA at the subpath will need to reinstall after a custom-domain migration — browsers treat the two origins as different apps.
