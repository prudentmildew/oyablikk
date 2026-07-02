---
status: proposed
---

# Custom domain cut-over: apex domain, no CNAME file

_Adopted from tonsoclock ADR-0015. The mechanism is unchanged; the concrete domain is an open question for Øyablikk (PRD §10.1), so this ADR is **proposed**, not yet accepted._

When a domain is chosen, move Øyablikk to a **custom apex domain** (candidates: `oyablikk.no`, its punycode form, or `oyablikk.app` — PRD §10.1). Because the site deploys via a GitHub Actions workflow ([0009](./0009-github-pages-deploy.md)), the custom domain is configured entirely in repo Settings → Pages — **not** via a `CNAME` file in the build. GitHub's docs are explicit: on Actions-based deploys "no `CNAME` file is created, and any existing `CNAME` file is ignored and is not required." [0009](./0009-github-pages-deploy.md) already made the build origin-agnostic (relative `base`, relative manifest/icon paths), so the cut-over needs **zero code changes** — it is purely DNS plus one repo setting.

The apex is canonical; GitHub auto-provisions the `www` → apex redirect. Apex DNS uses GitHub Pages' four `A` and four `AAAA` records.

**This decision blocks on PRD §10.1** (domain availability + choice), which in turn gates the DNS setup, the Cloudflare analytics site token ([0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md)), and the OG asset URLs. It does not block development.

## Considered options

- **`www` as canonical.** Rejected: the apex is shorter and cleaner for a glanceable, word-of-mouth fan app; GitHub redirects `www` to it anyway.
- **A `CNAME` file in `public/`.** Rejected: Actions-based Pages deploys ignore it, so it would imply it does something while doing nothing. The domain belongs in Settings → Pages.

## Consequences

- The cut-over is manual and decoupled from any merge: someone runs DNS → Settings → Pages → Enforce HTTPS.
- Users who installed the PWA from the github.io subpath must **reinstall** — browsers key PWA identity to origin.
- **Enforce HTTPS** can take up to 24 h to become available after the domain validates, while the Let's Encrypt certificate provisions.
