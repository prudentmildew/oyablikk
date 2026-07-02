---
status: accepted
---

# Cloudflare Web Analytics, superseding the no-third-party-requests rule

_Adopted from tonsoclock ADR-0016. The decision is unchanged; Øyablikk needs its **own** site token, issued against its own domain._

We want to know whether anyone actually uses the app — a question [0011](./0011-no-third-party-requests-self-hosted-assets.md)'s "zero third-party requests" stance left unanswerable. We add Cloudflare Web Analytics: a single cookieless beacon (`static.cloudflareinsights.com/beacon.min.js`) that counts page views without cookies, fingerprinting, or cross-site tracking. Cloudflare derives a coarse location from the visitor's IP to tally the visit and does not retain the IP. This supersedes [0011](./0011-no-third-party-requests-self-hosted-assets.md): the app now makes exactly one third-party request, and the About-page privacy text discloses it honestly.

**Øya delta:** the beacon needs a **new site token**, issued in Cloudflare against Øyablikk's own domain once [0015](./0015-custom-domain-apex-no-cname-file.md) resolves (PRD §10.1). Until the custom domain is live, the token is registered against the github.io Pages URL. The self-hosted font from [0011](./0011-no-third-party-requests-self-hosted-assets.md) stays self-hosted — that decision is unaffected.

## Considered options

- **No analytics at all.** Rejected: leaves us blind to whether the app is used, with no feedback loop to justify continued maintenance.
- **Google Analytics.** Rejected: cookies, cross-site profiling, and the exact CDN-IP-leak pattern [0011](./0011-no-third-party-requests-self-hosted-assets.md) was written to avoid.
- **Self-hosted analytics (Plausible/Umami).** Rejected for now: keeps the zero-third-party promise but means running a back end the app has deliberately never had.

## Consequences

- The "nothing leaves your device" claim is no longer literally true; the privacy text discloses one anonymous third-party flow. Any *further* third-party request needs its own copy rewrite.
- The privacy claim stays verifiable in the network tab: exactly one beacon, no cookies set.
