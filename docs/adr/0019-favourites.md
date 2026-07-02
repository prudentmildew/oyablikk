---
status: accepted
---

# Favourites: tap-to-star an act, persisted locally

_New decision, original to Øyablikk — the one feature it adds over Tons o'Clock (PRD §5)._

Answer a second question alongside "who's on now": **which of *my* artists are coming up?** The user taps an act block to star it; starred acts are highlighted in place in the grid. State is client-side only, consistent with the privacy stance ([0011](./0011-no-third-party-requests-self-hosted-assets.md) / [0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md)).

## Decisions

- **The whole tap gesture belongs to starring.** Tapping an act block toggles its favourite state — no long-press, no detail view. An act **detail sheet** (bio / photo / Spotify) is explicitly out of scope (PRD §2) even though the Sanity source has the data: the tap is spent on starring, not on opening a sheet.
- **Highlight in place; never dim, hide, or move.** A starred act gets a star glyph plus a visually louder block (brighter fill or outline), legible in sunlight and distinguishable from stage-colour differences. Unstarred acts are never dimmed. There is **no favourites-only filter** — the grid always shows the full programme; starred acts merely pop ([0007](./0007-concert-poster-visual-idiom.md)).
- **Persistence keyed by stable identity.** localStorage key `oya.favourites`, storing the Sanity artist `_id` plus performance slot — **never array indices**. A nightly refresh ([0009](./0009-github-pages-deploy.md)) can shift times, cancel, or add acts; index-based keys would mis-attribute stars. A favourite whose act disappears from the data is **silently dropped**.
- **The state flip is the feedback.** Instant re-render, no toast. A subtle first-use hint is optional, not required.
- **Toggle only on a clean tap.** Tap targets are large blocks inside a scroll container, so toggling must fire on a clean tap and not on scroll-end — the same tap-vs-scroll discipline as existing gesture handling. This is the main correctness risk and gets dedicated tests (toggle, persistence, stale-act pruning, tap-vs-scroll).

## Considered options

- **Tap opens a detail sheet; star via a corner control.** Rejected (PRD §2): a detail view is deferred, and a small star control on a dense sunlit grid is a worse tap target than the whole block.
- **A favourites-only filter mode.** Rejected: the app's value is the at-a-glance full grid; hiding unstarred acts would answer "my lineup" at the cost of "who's on now on the other stages". Starred acts popping in place serves both.
- **Clash highlighting between favourites.** Rejected — clash stays out ([0010](./0010-no-clash-feature.md)); favourites is about *my* lineup, not conflicts.

## Consequences

- `oya.favourites` joins the client-side state set. It is unversioned; a favourite referencing a now-absent `_id` is pruned on load, so stale entries self-heal across editions.
- Favourite identity depends on the Sanity `_id` surviving into `schedule.json` in a stable form — the transform ([0004](./0004-schedule-json-as-minimal-app-input.md)) must carry an act identity derived from it, not just `name`/time.
