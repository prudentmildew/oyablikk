---
status: superseded by ADR-0020
---

# `programme.raw.json` is tracked in git and sorted on write

> **Superseded by [ADR-0020](./0020-single-script-pipeline.md).** `programme.raw.json` is never written; `schedule.json` (deterministically sorted, no volatile fields) is the single committed artifact, and the diff-gate reduces to `git diff --quiet`. The schema canary is retired — fail-loud validation of consumed fields is the canary.

_Adopted from tonsoclock ADR-0005. The mechanism is unchanged; the volatile-field and schema-canary specifics are re-pointed at Sanity._

`data/programme.raw.json` is committed to the repository and emitted by the scrape step in a stable on-disk order — artists sorted by Sanity `_id`, each artist's `artistProgram` entries sorted by `(day, stage, start)`.

The driver is the nightly refresh workflow ([0009](./0009-github-pages-deploy.md)), which gates the transform (and any deploy) on whether a freshly-scraped raw payload differs from the committed one. That comparison ignores the volatile **`fetchedAt`** field but keeps a **schema canary** — the set of source fields observed in the response — as a tripwire for Sanity schema drift (standing in for Appmiral's old `embedVersion`). The gate only works if the committed file is present and deterministically ordered; otherwise incidental reordering in Sanity's response would register as a diff every night and the gate would degrade to "always run, always commit".

Sorting does not violate [0003](./0003-scraper-output-mirrors-source-shape.md): that ADR commits to mirroring source *shape* (artist-first, raw Sanity IDs, no app enrichment), not source *iteration order*, which is incidental and carries no information the app or a debugging human cares about.
