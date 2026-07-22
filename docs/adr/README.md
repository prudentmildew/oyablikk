# Architecture Decision Records

Øyablikk was copied and adapted from [Tons o'Clock](https://tonsoclock.no)
(`prudentmildew/tonsoclock`). Rather than link out to another repo's history,
the re-affirmed decisions are restated here as fresh ADRs so this repo is
self-explanatory. Each such ADR carries an **"Adopted from tonsoclock
ADR-NNNN"** note and spells out the Øya-edition delta.

## Numbering

ADR numbers **mirror the tonsoclock numbering** (0003–0017) so that every
`ADR-NNNN` reference in `docs/PRD.md` and every cross-reference between ADRs
resolves without translation. Two numbers are intentionally absent:

- **0001 / 0002** covered the *clash* feature (semantics, and client-side
  detection). Øyablikk never implemented clash highlighting, so those records
  don't exist here — see **[0010](./0010-no-clash-feature.md)**, which adopts
  tonsoclock's decision to drop the feature.

New decisions original to Øyablikk are numbered **above** the ported range:

- **[0018](./0018-sanity-content-lake-as-programme-source.md)** — Sanity content
  lake replaces Appmiral as the programme source (the acquisition-layer rewrite).
- **[0019](./0019-favourites.md)** — Favourites, the one new feature over
  Tons o'Clock.
- **[0020](./0020-single-script-pipeline.md)** — single-script pipeline: the
  fetch emits `schedule.json` directly, superseding 0003/0005 and simplifying
  the nightly workflows (`workflow_call`, no SHA gate).

## Index

| ADR | Decision | Source |
|---|---|---|
| 0003 | ~~Scraper output mirrors source shape~~ (superseded by 0020) | tonsoclock 0003 |
| 0004 | `schedule.json` is the minimal app input (+ act `id`) | tonsoclock 0004 |
| 0005 | ~~`programme.raw.json` tracked and sorted~~ (superseded by 0020) | tonsoclock 0005 |
| 0006 | Fail loud on input violations; two-sided `type` allowlist | tonsoclock 0006 |
| 0007 | Concert-poster visual idiom; no theme toggle | tonsoclock 0007 |
| 0008 | Live mode: default day, NOW line, scroll-to-now | tonsoclock 0008 |
| 0009 | GitHub Pages deploy; portable paths; two workflows | tonsoclock 0009 |
| 0010 | No clash feature | tonsoclock 0010 |
| 0011 | Self-hosted assets (superseded by 0016 for analytics) | tonsoclock 0011 |
| 0012 | Schedule chrome is static across day swipes | tonsoclock 0012 |
| 0013 | Service worker with silent auto-update | tonsoclock 0013 |
| 0014 | Install prompt is conditional, quiet, one-shot | tonsoclock 0014 |
| 0015 | Custom apex domain, no CNAME file | tonsoclock 0015 |
| 0016 | Cloudflare Web Analytics, superseding no-third-party | tonsoclock 0016 |
| 0017 | First-visit swipe nudge | tonsoclock 0017 |
| 0018 | Sanity content lake as programme source | new |
| 0019 | Favourites | new |
| 0020 | Single-script pipeline emitting `schedule.json` directly | new |
| 0021 | Focus: a transient dim of the unstarred (narrows 0019) | new |
