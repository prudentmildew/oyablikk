# Scraper output mirrors source shape; app mapping is a separate transform

_Adopted from tonsoclock ADR-0003. The decision stands; only the source system changes — Øya publishes via a Sanity content lake, not Appmiral (see [0018](./0018-sanity-content-lake-as-programme-source.md))._

The scrape step writes `data/programme.raw.json` in a shape that mirrors **Øya's Sanity source** — artist-documents-first, preserving Sanity's raw `_id`s, `_ref`s, and field names (`artistProgram`, `programStartTime`, `programStage`, …) — rather than producing the app's days-first, app-IDed `data/schedule.json` directly. Mapping Sanity stage/day `_ref`s onto the app's brand stage IDs, injecting the app's colours, and otherwise enriching toward the app data model belongs in a separate transform step.

Keeping the two files separate preserves all source information for debugging nightly-cron diffs, decouples the scraper from app-side schema changes, and gives stage/day-ref mapping its own clean home (it will need iteration as Øya's dataset changes between editions). The alternative — one script writing straight to `schedule.json` — would couple fetch concerns to render concerns and lose provenance that costs nothing to keep.
