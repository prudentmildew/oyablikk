---
status: accepted
---

# Sanity content lake as the programme source (replacing Appmiral)

_New decision, original to Øyablikk. It is the acquisition-layer counterpart to the pipeline ADRs [0003](./0003-scraper-output-mirrors-source-shape.md)–[0006](./0006-transform-fails-loud-on-input-violations.md), which are otherwise adopted from Tons o'Clock unchanged._

Tons o'Clock scraped its programme from **Appmiral** (an HTML lineup page plus per-artist page crawl, with politeness delays and DOM parsing). **Øya does not use Appmiral.** Øya publishes its programme through a public **Sanity content lake**, so Øyablikk's scrape step is rewritten to query Sanity directly — replacing essentially all of the old `scripts/appmiral/` machinery — while the raw-mirror → transform → minimal-JSON architecture ([0003](./0003-scraper-output-mirrors-source-shape.md)–[0006](./0006-transform-fails-loud-on-input-violations.md)) is preserved.

## Source (verified 2 July 2026)

- Project `sehba7v8`, dataset `production`, publicly queryable without auth:
  `https://sehba7v8.api.sanity.io/v<api-version>/data/query/production?query=<GROQ>`
- Document types: `artist`, `program`, `programDay`, `programStage`.
- `artist` documents carry `name`, `slug`, `artistYear` (filter to `2026`), `type` (distinguishes club / Øyanatt from park acts), and `artistProgram { programStartTime, programEndTime, programDay->, programStage-> }`.
- `programDay` / `programStage` are references; the GROQ query joins them (`->`) so the raw file contains resolved day dates and stage names.

## Scrape step

One or a few GROQ queries fetch all 2026 park artists with joined day/stage — no HTML parsing, no per-artist crawl, no politeness delays. Output `data/programme.raw.json` mirrors the **Sanity** shape ([0003](./0003-scraper-output-mirrors-source-shape.md)), deterministically sorted ([0005](./0005-raw-programme-tracked-and-sorted.md)), with `fetchedAt` volatile and a **schema canary** (the set of observed source fields) standing in for Appmiral's `embedVersion`. The step exits non-zero on any fetch/shape failure so the nightly job aborts before committing — partial data is worse than stale data.

## Considered options

- **Keep an Appmiral-style HTML scraper.** Rejected: Øya's programme isn't served that way; the Sanity API gives structured, joinable data with no DOM fragility or crawl etiquette to manage.
- **Scrape Øya's server-rendered Next.js programme page.** Held as **fallback only** (PRD §10.4): if the Sanity dataset is locked down before August, the raw-mirror architecture isolates the change to the fetch layer, so switching to HTML parsing there would leave the transform and app untouched.

## Consequences & open dependencies

- The transform's edition config maps Sanity stage `_ref` → `{id, name, color, textColor}` and Sanity day `_ref` → ISO date (2026-08-12 … 2026-08-15). Unmapped refs fail loud ([0006](./0006-transform-fails-loud-on-input-violations.md)).
- **Park-act `type` semantics must be pinned** (PRD §10.2) before the transform's park-vs-non-park allowlist is written; `club` and `oyanatt` are confirmed non-park values.
- **Stage count**: the programme page shows five park stages while press copy says "six" (PRD §10.3). The fail-loud unmapped-stage error will catch any sixth stage when the scraper first runs against full 2026 data.
- New tests use **Sanity response fixtures** in place of Tons o'Clock's Appmiral HTML fixtures.
