---
status: accepted
---

# Single-script pipeline: fetch emits `schedule.json` directly

_New decision, original to Øyablikk. **Supersedes [0003](./0003-scraper-output-mirrors-source-shape.md) and [0005](./0005-raw-programme-tracked-and-sorted.md)**; amends the scrape-step section of [0018](./0018-sanity-content-lake-as-programme-source.md) and the workflow-linking mechanism of [0009](./0009-github-pages-deploy.md). [0004](./0004-schedule-json-as-minimal-app-input.md) (minimal schema) and [0006](./0006-transform-fails-loud-on-input-violations.md) (fail loud) stand, amended in place._

The fetch→raw→transform pipeline collapses into **one script** that queries Øya's Sanity content lake, validates fail-loud, and emits the canonical `data/schedule.json` directly. `data/programme.raw.json` is never written; the schema canary is retired (validation of the fields we actually consume *is* the canary).

## Why the two-file design no longer earns its keep

ADR-0003/0005's raw mirror was motivated by Appmiral: an expensive multi-page HTML crawl (politeness delays, fragile DOM parsing) where committing the raw payload bought cheap provenance, because reproducing a fetch was costly and the source was noisy. Øya's source is one public GROQ endpoint returning structured JSON, reproducible with a single `curl`. If the nightly fails at 03:00, we re-run the query — we don't need last night's raw in git. What ADR-0003 called decoupling survives as a *function boundary* instead of a *file boundary* (see seam, below).

## Decisions

1. **One script** (`scripts/fetch-schedule.ts`): GROQ query → validate → emit `data/schedule.json`. Exits non-zero on any fetch/validation failure so the nightly aborts before committing.
2. **Thin shell, pure core.** All validation, the `type` allowlist, ref mapping, sorting, and shaping live in a pure `toSchedule(sanityDocs, editionConfig)` function, tested directly against Sanity response fixtures. The shell (build URL, fetch, parse, write) needs no test beyond "exits non-zero when the core throws or the fetch fails".
3. **GROQ does the shaping**: filter `artistYear`, join `programDay->`/`programStage->` refs, project only consumed fields, against a **date-pinned API version** (e.g. `/v2025-02-19/`). The **`type` filter stays in the core** — the two-sided allowlist ([0006](./0006-transform-fails-loud-on-input-violations.md)) must see every type value to throw on unknowns; filtering types in GROQ would silently reintroduce the exclude-unknowns failure mode.
4. **No volatile fields.** `schedule.json` carries no `fetchedAt`; combined with deterministic sorting (days by date, acts by `(stage, start, id)`), the nightly diff-gate reduces to `git diff --quiet`.
5. **Zero runtime dependencies**: Node 22 built-in `fetch`, hand-rolled validation (the shapes are small and the fail-loud errors are bespoke anyway). No Sanity client SDK, no schema library.
6. **Duplicate-id guard**: the core throws if two acts share an `id` (see [0004](./0004-schedule-json-as-minimal-app-input.md)'s act `id` = Sanity artist `_id`). One artist document carries exactly one `artistProgram` object today; if Øya ever remodels it as an array, this turns a silent collision into a red run.
7. **Workflow linking via `workflow_call`** (amends [0009](./0009-github-pages-deploy.md)): `deploy.yml` is a reusable workflow triggered by `push: main` *and* callable. The nightly runs the script; if `git diff --quiet` reports a change it commits, pushes, and **calls deploy directly as a dependent job**. The `workflow_run` event and SHA-comparison gate are dropped — they existed only to infer, from the outside, what the nightly already knows (whether it committed). The nightly also gets a `concurrency:` group (no overlapping runs) and a `workflow_dispatch` trigger (manual refresh).

## Considered options

- **Keep the two-file pipeline** (status quo of 0003/0005). Rejected: two scripts, two committed artifacts, and `fetchedAt` normalisation in the diff-gate, purchasing provenance that a public, one-curl-reproducible API makes nearly worthless.
- **One script, raw as untracked debug artifact.** Rejected: a second output path to maintain for a postmortem need that `curl` serves better.
- **`workflow_run` + SHA gate** (as ported in 0009). Rejected: proven at tonsoclock, but the guard logic's only purpose is inferring what the caller can simply state.

## Empirical basis (public dataset, verified 2 July 2026)

135 artists for 2026 — 82 `festival`, 34 `club`, 19 `oyanatt`; zero missing `type`, zero festival acts missing `artistProgram`; no `end <= start` violations among park acts; no duplicate artist names. `artistProgram` is a **single object** per artist document, so the artist `_id` is a collision-free performance identity. Park acts span **six stages** (Amfiet, Sirkus, Vindfruen, Hagen, Klubben, Trekanten) across **five days** (2026-08-11 … 2026-08-15; the 11th holds a single opening act).

## Consequences

- `git log -- data/schedule.json` becomes the readable history of real programme changes — the role 0005 assigned to the raw file, now served by the canonical artifact itself.
- Debugging upstream schema drift relies on fail-loud error messages plus re-querying the live endpoint, not committed raw history. Accepted trade-off.
- If Sanity locks the dataset before August (PRD §10.4), the fallback (scraping the server-rendered programme page) replaces the shell's fetch; the pure core and everything downstream are untouched.
