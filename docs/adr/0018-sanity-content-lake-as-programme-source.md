---
status: accepted
---

# Sanity content lake as the programme source (replacing Appmiral)

_New decision, original to Øyablikk. It is the acquisition-layer counterpart to the pipeline ADRs — see [0020](./0020-single-script-pipeline.md), which collapsed the originally-planned raw-mirror pipeline into a single fetch script and **amends this ADR's scrape-step section**._

Tons o'Clock scraped its programme from **Appmiral** (an HTML lineup page plus per-artist page crawl, with politeness delays and DOM parsing). **Øya does not use Appmiral.** Øya publishes its programme through a public **Sanity content lake**, so Øyablikk's acquisition layer queries Sanity directly — replacing essentially all of the old `scripts/appmiral/` machinery.

## Source (verified against the live dataset, 2 July 2026)

- Project `sehba7v8`, dataset `production`, publicly queryable without auth:
  `https://sehba7v8.api.sanity.io/v<api-version>/data/query/production?query=<GROQ>` (the app pins a dated API version — [0020](./0020-single-script-pipeline.md)).
- Document types: `artist`, `programDay`, `programStage` (plus CMS-layout types like `programPage`, irrelevant to us).
- `artist` documents carry `name`, `slug`, `artistYear` (filter to `2026`), `type` — **pinned values: `festival` (park), `club` (Klubbøya), `oyanatt` (Øyanatt)** — and a **single** `artistProgram` object `{ programStartTime, programEndTime, programDay->, programStage-> }`. One artist document = one performance, so the artist `_id` is the act identity ([0004](./0004-schedule-json-as-minimal-app-input.md)).
- `programDay.day` is an ISO date string; `programStage.stage` is the stage name. Both are joined in-query (`->`).
- 2026 census: 135 artists — 82 `festival` / 34 `club` / 19 `oyanatt`; zero missing `type` or `artistProgram`; park acts span six stages over five days (Tue 11 – Sat 15 August).

## Fetch step (amended by [0020](./0020-single-script-pipeline.md))

One GROQ query fetches all 2026 artists with joined day/stage — no HTML parsing, no per-artist crawl, no politeness delays. A single script validates fail-loud ([0006](./0006-transform-fails-loud-on-input-violations.md)) and emits `data/schedule.json` directly; no raw mirror is written. The step exits non-zero on any fetch/shape failure so the nightly job aborts before committing — partial data is worse than stale data.

## Considered options

- **Keep an Appmiral-style HTML scraper.** Rejected: Øya's programme isn't served that way; the Sanity API gives structured, joinable data with no DOM fragility or crawl etiquette to manage.
- **Scrape Øya's server-rendered Next.js programme page.** Held as **fallback only** (PRD §10.4): if the Sanity dataset is locked down before August, the raw-mirror architecture isolates the change to the fetch layer, so switching to HTML parsing there would leave the transform and app untouched.

## Consequences & resolved questions

- The edition config maps Sanity stage `_ref` → `{id, name, color, textColor}` and Sanity day `_ref` → ISO date (2026-08-11 … 2026-08-15). Unmapped refs fail loud ([0006](./0006-transform-fails-loud-on-input-violations.md)).
- **PRD §10.2 resolved:** park acts are `type == "festival"`; `club` and `oyanatt` are excluded via the two-sided allowlist ([0006](./0006-transform-fails-loud-on-input-violations.md)).
- **PRD §10.3 resolved:** the press copy's "six stages" is correct — **Trekanten** is the sixth (one act in 2026, default-hidden; [0007](./0007-concert-poster-visual-idiom.md)). The programme page undersold it.
- **New finding:** a fifth programme day exists — Tuesday 11 August, one opening act — included as a data-driven pane ([0008](./0008-live-mode-default-day-and-scroll.md)).
- New tests use **Sanity response fixtures** in place of Tons o'Clock's Appmiral HTML fixtures.
