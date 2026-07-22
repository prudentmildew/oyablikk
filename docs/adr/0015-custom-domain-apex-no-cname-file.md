---
status: accepted
---

# Custom domain cut-over: apex domain, no CNAME file

_Adopted from tonsoclock ADR-0015. The mechanism is unchanged; the domain choice (PRD §10.1) was open at adoption and is now settled: **`oyablikk.no`**, cut over and live._

Øyablikk serves from the **apex `oyablikk.no`**. Because the site deploys via a GitHub Actions workflow ([0009](./0009-github-pages-deploy.md)), the custom domain is configured entirely in repo Settings → Pages — **not** via a `CNAME` file in the build. GitHub's docs are explicit: on Actions-based deploys "no `CNAME` file is created, and any existing `CNAME` file is ignored and is not required." [0009](./0009-github-pages-deploy.md) already made the build origin-agnostic (relative `base`, relative manifest/icon paths), so the cut-over needed **no code changes to the app itself** — purely DNS plus one repo setting. The one exception is the two Open Graph tags in `index.html`, which must be absolute and therefore name the origin literally.

The apex is canonical; GitHub auto-provisions the `www` → apex redirect, and the old `prudentmildew.github.io/oyablikk/` origin 301-redirects. Apex DNS uses GitHub Pages' four `A` and four `AAAA` records.

The domain also fixes the origin for the Cloudflare analytics site token ([0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md)) — the token is per-hostname, so it is issued for `oyablikk.no`.

## Considered options

- **`www` as canonical.** Rejected: the apex is shorter and cleaner for a glanceable, word-of-mouth fan app; GitHub redirects `www` to it anyway.
- **A `CNAME` file in `public/`.** Rejected: Actions-based Pages deploys ignore it, so it would imply it does something while doing nothing. The domain belongs in Settings → Pages.

## Consequences

- The cut-over was manual and decoupled from any merge: DNS → Settings → Pages → Enforce HTTPS. Done; HTTPS is enforced.
- Users who installed the PWA from the github.io subpath must **reinstall** — browsers key PWA identity to origin.
- **Enforce HTTPS** can take up to 24 h to become available after the domain validates, while the Let's Encrypt certificate provisions.
- Absolute URLs in the repo (OG tags, docs) now name `oyablikk.no`. A future origin change means grepping for it again — the cost of the two tags that cannot be relative.
