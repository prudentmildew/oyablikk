# Øyablikk — Øya Festivalen 2026 Schedule App

**PRD — 2 July 2026** _(revised same day after live-data verification and a design grilling: six park stages and five programme days confirmed against the Sanity dataset; pipeline simplified per [ADR-0020](adr/0020-single-script-pipeline.md); open questions 2 and 3 resolved)_

A sibling of [Tons o'Clock](https://tonsoclock.no) (`prudentmildew/tonsoclock`) for Øya Festivalen 2026. New repo, copied and adapted from the Tons o'Clock codebase. This PRD is self-contained: it restates everything the new project needs, marks what carries over unchanged, and specifies what's new.

## 1. Product summary

A mobile web app answering one question, in one glance, in direct sunlight:

> Who's on right now, on which stage — and which of *my* artists are coming up?

Single screen. Horizontally swipeable day panes (one per programme day — five in 2026), stages as columns, time on the y-axis, an accent-coloured **NOW** line at the current Oslo time. New over Tons o'Clock: **favourites** — tap an act to star it.

- **Festival:** Øya Festivalen, Tøyenparken, Oslo — **12–15 August 2026** (Wed–Sat), plus a single opening act on Tuesday 11 August (in the park programme data; rendered as a fifth day pane).
- **Name:** Øyablikk (Norwegian: "moment / blink of an eye" — contains "Øya", captures the at-a-glance promise).
- **Ship deadline:** live and installable well before 12 August 2026.
- **Status:** unaffiliated fan project (same stance as Tons o'Clock; About page must say so).

## 2. Scope

### In scope

- The **park programme only**: the six Tøyenparken stages across five days (park hours roughly 11:00–23:00 — acts never cross midnight, preserving the transform's `end > start` invariant).
- One new feature over Tons o'Clock: **Favourites** (§5).
- Everything in the carry-over inventory (§7).

### Out of scope (non-goals)

- **Klubbøya** club shows and **Øyanatt** after-hours sets (cross midnight, sprawl across many one-off venues; a different product).
- Act detail sheet (bio/photo/Spotify — the Sanity source has the data, but it's deliberately deferred; tap is spent on starring).
- Artist search.
- Clash highlighting (removed from Tons o'Clock per ADR-0010 after user testing; not revisited even with favourites).
- Favourites-only filter mode (the grid always shows the full programme; starred acts pop visually).
- Theme toggle / light theme (re-affirming ADR-0007).
- Any server-side or account-based state.

## 3. Domain model

Carried over from Tons o'Clock's `CONTEXT.md` (Festival, Day, Stage, Stage colour, Act, Artist, Schedule, Header, Stage row, Settings, Stage filter, About, Now line) with these edition changes and additions:

- **Festival:** Øya Festivalen 2026, Oslo, 12–15 August.
- **Stage:** six park stages — **Amfiet, Sirkus, Vindfruen, Hagen, Klubben, Trekanten** (the sixth verified against the 2026 dataset; §10.3 resolved).
- **Favourite:** a per-user mark on an Act, toggled by tapping the act block, persisted in localStorage. Highlighted in place in the grid.
- **Programme (source-side):** the schedule as published in Øya's Sanity content lake (not Appmiral). "Performance" as an Appmiral term is retired; the source-side unit is an artist document's `artistProgram`.

The new repo starts its own `CONTEXT.md` with this glossary.

## 4. Core UX (ported behaviour)

Identical in behaviour to Tons o'Clock unless noted:

- **Schedule grid:** one vertical scroll container; full-width day panes (one per programme day, `days.length`-driven) with horizontal scroll-snap; visible stages as columns of act blocks positioned by start time (2 px/minute); each block shows start time, artist name, end time.
- **Static chrome (ADR-0012):** header, stage row, time rail, and NOW line render once at schedule level; only act blocks live per-pane.
- **Header:** app logo, current day label, settings gear. No tabs or dots.
- **NOW line (ADR-0008):** drawn at the current `Europe/Oslo` time-of-day across all panes; visible whenever the time-of-day falls inside the union of the days' envelopes; ticks every 60 s. On launch: open today's pane (fallback outside the festival: Wednesday 12 August, the first full programme day), centre the line once per session.
- **Stage filter:** settings bottom sheet with per-stage checkboxes; hidden stages persist in localStorage; remaining columns re-flow.
- **Default-visible stages:** **Amfiet, Sirkus, Vindfruen**. **Hagen, Klubben and Trekanten are default-hidden** (opt-in via the filter) to keep three glanceable columns — the Tons o'Clock pattern. The Settings sheet must make the hidden stages discoverable (visible, unchecked, not buried). _Noted with eyes open: Hagen is the busiest stage by act count (20) — the default set ranks by headliner weight, not volume._
- **About page:** second page in the settings sheet — first-person origin note, unaffiliated-fan-project disclaimer, privacy statement (localStorage-only state + the one analytics beacon), install fallback instructions.

## 5. New feature: Favourites

- **Toggle:** tapping an act block toggles its favourite state. No long-press, no detail view — the whole tap gesture belongs to starring.
- **Rendering:** starred acts are highlighted in place — a star glyph plus a visually louder block (e.g. brighter fill or outline), legible in sunlight and distinguishable from stage colour differences. Unstarred acts are never dimmed or hidden.
- **Persistence:** localStorage only (key e.g. `oya.favourites`), storing stable act identities. Use the Sanity artist `_id` verbatim (one artist document = one performance in Øya's model; the fetch script guards against duplicate ids) rather than array indices, so a nightly data refresh (time shifts, stage moves, cancellations, additions) never mis-attributes a star. A favourite whose act disappears from the data is silently dropped.
- **Feedback:** the state flip itself is the feedback (instant re-render); no toast. A subtle first-use hint is optional, not required.
- **Accidental-tap risk:** tap targets are large blocks in a scroll container; toggling must only fire on a clean tap (not scroll-end), same discipline as existing gesture handling.

## 6. Data pipeline

_Revised per [ADR-0020](adr/0020-single-script-pipeline.md): the originally-planned raw-mirror + separate-transform pipeline (ADR-0003/0005) is collapsed into a single fetch script — Øya's public GROQ endpoint makes committed raw provenance unnecessary. The minimal-app-JSON (ADR-0004) and fail-loud (ADR-0006) stances are unchanged. The **acquisition layer is rewritten**: Øya does not use Appmiral._

### Source: Øya's public Sanity content lake

Verified 2 July 2026:

- Project `sehba7v8`, dataset `production`, publicly queryable without auth:
  `https://sehba7v8.api.sanity.io/v<api-version>/data/query/production?query=<GROQ>`
- Relevant document types: `artist`, `program`, `programDay`, `programStage`.
- Artist documents carry `name`, `slug`, `artistYear` (filter to 2026), `type` (distinguishes club/Øyanatt from park acts), and `artistProgram { programStartTime, programEndTime, programDay→ref, programStage→ref }`.
- `programDay` / `programStage` are references; the GROQ query joins them (`->`) so the raw file contains resolved day dates and stage names.

### Fetch step (single script, ADR-0020)

- One GROQ query (date-pinned API version) fetching all 2026 artists with joined day/stage refs and only the consumed fields projected. No HTML parsing, no per-artist page crawl, no politeness delays — this replaces ~all of `scripts/appmiral/`. The `type` filter happens in code, not in GROQ (the allowlist must see unknown values to fail loud on them).
- Structured as a thin IO shell around a pure `toSchedule(sanityDocs, editionConfig)` core, tested against Sanity response fixtures. Zero runtime dependencies (Node 22 `fetch`, hand-rolled validation).
- Hardcoded `OYA_2026` edition config: Sanity stage `_ref` → `{id, name, color, textColor}`; Sanity day `_ref` → ISO date (2026-08-11 … 2026-08-15).
- Filters: `artistYear == 2026`, park acts only (`type == "festival"`; `club`/`oyanatt` are allowlisted exclusions, unknown `type` values throw — §10.2 resolved), acts with complete `artistProgram`.
- Fail loud (ADR-0006) on: unmapped stage or day refs, `end <= start`, missing times on a park act, duplicate act ids.
- Output `data/schedule.json` directly — no raw mirror, no `fetchedAt`, deterministically sorted. Same minimal shape as Tons o'Clock plus a stable act `id` (the Sanity artist `_id`), so the entire rendering layer ports unmodified.
- Exit non-zero on any fetch/validation failure so the nightly job aborts before committing (partial data is worse than stale data).

### Nightly refresh

Two single-responsibility workflows (ADR-0009 as amended by ADR-0020): cron (+ `workflow_dispatch`, with a `concurrency` group) runs the fetch script → diff-gate is just `git diff --quiet` (no volatile fields to normalise) → bot commit on change → deploy invoked directly via `workflow_call` (no `workflow_run` chaining, no SHA gate; `deploy.yml` also triggers on `push: main` for human commits).

## 7. Carry-over inventory

| Behaviour | Source ADR | Øyablikk changes |
|---|---|---|
| Concert-poster dark idiom, no theme toggle | 0007 | Keep black bg + act-name-dominant type; **new five-stage palette + accent** with an Øya flavour (§8) |
| Live mode: default day, NOW line, scroll-to-now | 0008 | Dates/timezone config only (`Europe/Oslo` unchanged) |
| GitHub Pages deploy, relative paths, two workflows | 0009 | New repo, new Pages site |
| Clash feature stays removed | 0010 | Unchanged |
| Self-hosted fonts, no third-party requests post-load | 0011/0016 | Unchanged (font choice may change with branding; must stay self-hosted) |
| Static schedule chrome across day swipes | 0012 | Unchanged |
| Service worker: offline shell, silent auto-update | 0013 | Unchanged |
| Install prompt: quiet, conditional, one-shot | 0014 | New hard cutoff **2026-08-16T00:00+02:00**; About-page fallback kept |
| Custom apex domain via Pages settings, no CNAME file | 0015 | New domain (§10, open) |
| Cloudflare Web Analytics, cookieless beacon | 0016 | **New site token** for the new domain; About privacy copy discloses it |
| First-visit swipe nudge | 0017 | Unchanged (incl. reduced-motion opt-out, install-sheet precedence) |

localStorage keys get a fresh namespace (`oya.*`): settings/hidden stages, favourites, first-visit date, install-prompt-shown, has-swiped.

## 8. Visual identity

- **Keep:** black background, saturated per-stage colour fills, act-name-dominant typography, sunlight-first contrast discipline. This is a usability decision (phone, daylight, outdoor crowd), independent of genre.
- **Change:** the six stage colours and the accent colour are chosen fresh — colour-blind-safe as a set, glance-distinct at column width, nodding to Øya's greener/artsier identity rather than metal-red. The NOW line/pill uses the new accent.
- **Name/branding:** "Øyablikk" in title, manifest, header logo, OG assets. All icons/OG images are new (the Tons o'Clock asset-prompt runbook pattern can be reused with Øya brand rules).
- Typeface may stay Bebas Neue or change with the identity — but stays self-hosted either way.

## 9. Tech stack & repo

Copied and adapted from Tons o'Clock, not rewritten:

- Vanilla TypeScript + Vite (relative `base:'./'`), no framework; `vite-plugin-pwa` injectManifest with custom Workbox SW; Vitest + happy-dom; Biome; pnpm; Node 22 CI.
- Existing test suites port with the code; the rewritten scrape/transform gets new tests with **Sanity response fixtures** replacing the Appmiral HTML fixtures; favourites gets unit tests (toggle, persistence, stale-act pruning, tap-vs-scroll).
- New public GitHub repo; issue tracker, triage labels, and docs layout (`CONTEXT.md`, `docs/adr/`) per the same agent conventions. Port the ADR *decisions* by writing fresh ADRs in the new repo where they're re-affirmed (a short "adopted from tonsoclock ADR-NNNN" note suffices), so the new repo is self-explanatory.

## 10. Open questions

1. **Domain:** check availability for an Øyablikk-flavoured `.no`/`.app` (e.g. `oyablikk.no`, `oyablikk.no` punycode, `oyablikk.app`). Decision blocks DNS + analytics token + OG URLs, not development.
2. ~~**Park-act `type` semantics**~~ **Resolved (2 July 2026):** park acts are `type == "festival"`; the full value set is `festival` / `club` / `oyanatt`, with zero 2026 artists missing the field. The allowlist is two-sided (unknown values throw) — ADR-0006.
3. ~~**Sixth stage?**~~ **Resolved (2 July 2026):** the press copy was right — **Trekanten** is the sixth park stage (one act in 2026, on the newly-discovered fifth day, Tuesday 11 August). Configured default-hidden. The data also surfaced the fifth programme day itself, now rendered as a data-driven pane — ADR-0008.
4. **Sanity API stability:** the dataset is public today; if it's locked down before August, fallback is scraping the server-rendered Next.js programme page. The raw-mirror architecture isolates this risk to the fetch layer.
5. **Stage palette:** the six concrete colours (design task, not a blocker).

## 11. Milestones

Six weeks to festival. Ordered so the app is usable end-to-end early:

1. **Pipeline first** (repo bootstrap, single fetch script: Sanity GROQ → `schedule.json` with real 2026 data; fixtures + tests — ADR-0020). Proves the riskiest assumption immediately.
2. **Port the app shell** against real data: grid, day swipe, NOW line, stage filter with new defaults, settings/About, new branding/palette.
3. **Favourites.**
4. **PWA chrome:** SW/offline, install prompt (new cutoff), swipe nudge, icons/OG assets.
5. **Ship:** repo public, Pages live, nightly refresh on, domain + analytics token, README.

## 12. Success criteria

- Opens on today's pane with the NOW line centred during festival hours; answers "who's on now" in one glance in sunlight.
- A starred act survives app restarts and nightly data refreshes.
- Works offline in the park after first visit; updates silently overnight.
- Nightly refresh commits only on real programme changes and never publishes a partial schedule.
- Zero third-party requests post-load except the disclosed analytics beacon; no cookies, no accounts.
