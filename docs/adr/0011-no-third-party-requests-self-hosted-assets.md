---
status: superseded by ADR-0016
---

# No third-party requests; self-hosted assets

_Adopted from tonsoclock ADR-0011. As in Tons o'Clock, the no-third-party-requests promise is later relaxed for a single analytics beacon by [0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md); the self-hosted-font decision below stands on its own._

> **Superseded (in part) by [ADR-0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md).** The app makes exactly one third-party request — Cloudflare Web Analytics — and the About-page privacy text discloses it. The self-hosted-font decision still stands.

The app collects no user data — no cookies, accounts, or back-end of its own — and the only persisted state is client-side `localStorage` (`oya.*`: hidden stages, favourites, first-visit date, install-prompt-shown, has-swiped). To keep that promise literally true, the display font is **self-hosted and bundled** rather than loaded from a CDN. A CDN font sends the user's IP to a third party on every load — the pattern a 2022 German court ruling found to breach the GDPR. The privacy stance is stated to the user on the in-app **About** page, so it is a load-bearing promise, not just a habit.

**Øya delta:** the typeface may change with the Øya branding (it need not stay Bebas Neue), **but it stays self-hosted either way** — the decision is about where assets load from, not which face is chosen.

We accept the costs of self-hosting (no cross-site CDN cache benefit; we own font-file updates) in return for a verifiable privacy claim (the network tab shows no third-party traffic beyond the one disclosed beacon) and offline rendering — worthwhile for a PWA used at a festival on weak signal.
