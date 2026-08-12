# Øyablikk — Øya Festivalen Schedule App

A mobile web app showing the Øya Festivalen 2026 park programme. Single screen, swipeable days, park stages as columns, a NOW line at the current Oslo time, and tap-to-star **Favourites**. Installable and offline-capable (service worker, ADR-0013), deployed to <https://oyablikk.no> from GitHub Pages (public repo). `README.md` is the human-facing tour; this file is the vocabulary. Sibling of [Tons o'Clock](https://tonsoclock.no) (`prudentmildew/tonsoclock`), copied and adapted from its codebase; this glossary is adopted from Tons o'Clock's `CONTEXT.md` with the Øya-edition changes noted inline.

## Language

**Festival**:
The event being scheduled — Øya Festivalen 2026, Tøyenparken, Oslo, 12–15 August (Wed–Sat), plus a single opening act on Tuesday 11 August. Only the **park programme** is in scope; Klubbøya club shows and Øyanatt after-hours sets are a different product (they cross midnight and sprawl across one-off venues).

**Day**:
One programme date. The **Edition config** maps five candidate dates (Tue 11 – Sat 15 August; the Tuesday would hold a single opening act), but the Schedule renders one pane per Day *present in the data* — the count is data-driven, not hardcoded, and a mapped date with no acts simply yields no pane. As published today the programme covers Wed–Sat only. The Schedule shows one Day's acts at a time; swiping horizontally switches the visible Day. Park hours run roughly 11:00–23:00 — acts never cross midnight, preserving the transform's `end > start` invariant.

**Day standing**:
A **Day**'s relation to the real-world Oslo date — `past`, `today` or `future` — plus `none`, the whole-app state when *no* pane is today, which is every date outside the festival and therefore most of the year (ADR-0022). Computed by `dayStanding()` in `src/now.ts` as a string compare against the current Oslo date; `none` comes from the existing `todayFestivalDate()` returning `null`. It drives two things and nothing else: the **Now line**'s appearance and the **Header**'s day label. Under `none` the whole feature is dormant — the Now line keeps its accent, the label is a plain date. Note the standing follows the *pane in view*, not the calendar alone, so it changes on a swipe.
_Avoid_: Relative day, day offset, recency.

**Stage**:
A physical performance location in the park. Seven exist: **Amfiet, Sirkus, Vindfruen, Hagen, Klubben, Trekanten, Biblioteket** (the last a talks stage). Each Stage owns a vertical column in the Schedule, distinguished by its **Stage colour**. The columns are shared across all Days — only the acts inside them change as the Day changes. **Trekanten and Biblioteket are default-hidden** (`DEFAULT_HIDDEN_STAGES` in the Edition config, opt-in via the Stage filter); the other five are visible by default.

**Stage colour**:
A per-Stage hex colour used to distinguish columns visually, paired with a per-Stage `textColor` for the text sitting on the fill. An app convention — not part of Øya's brand identity. The seven fills are saturated colours on black, colour-blind-safe as a set and text-contrast checked; the thresholds are pinned by `scripts/validate-palette.test.ts`, so a palette edit that breaks them fails the suite. Values live in the Edition config: Amfiet `#f42d0a`, Sirkus `#f8e91b`, Vindfruen `#1e99b8`, Hagen `#ed0799`, Klubben `#e074fb`, Trekanten `#5762fa`, Biblioteket `#b36161`.

**Accent**:
The eighth palette token, spring green `#3ddc7f` — the **Now line** and now pill, the logo wordmark, and controls. Chosen so no Stage fill sits near it in any vision type. Defined once in the Edition config (`ACCENT`) and as the `--accent` CSS custom property.

**Edition config**:
`scripts/edition-config.ts` — the one file that changes between festival editions. Maps Sanity `programStage`/`programDay` `_ref`s onto the app's Stage ids and ISO dates, carries the palette, the default-hidden Stages, and `FALLBACK_DAY` (the off-festival launch pane, `2026-08-12` — the first *full* day, deliberately not the sparse Tuesday).

**Act**:
A single artist's performance on one stage over a bounded time window. What the JSON `acts[]` entries represent.
_Avoid_: Slot, set, gig, performance.

**Artist**:
The band or performer named in an act. The `name` field of an act; on the source side, a Sanity `artist` document.
_Avoid_: Band, performer.

**Favourite**:
A per-user mark on an **Act**, toggled by tapping the act block. Persisted in `localStorage` (`oya.favourites`) keyed by the act `id` — the Sanity artist `_id` verbatim, never an array index — so a nightly data refresh never mis-attributes a star. Marked by a **heart**: outlined on every Act (the standing hint that a block is tappable), filled once favourited. The heart is an inline SVG, not a `♡`/`♥` character — the self-hosted font is a latin subset (ADR-0011), so a text heart would fall through to system fonts and render as an emoji on iOS. A favourited Act is highlighted in place in the grid — never hidden or moved, and never dimmed by default. A favourite whose Act disappears from the data is silently dropped. There is no favourites-only filter; the grid always shows the full programme. The one exception to "never dimmed" is **Focus**, below.

**Focus**:
A transient view state that dims unstarred Acts so the user's **Favourites** pop out of the grid. Toggled by the heart button in the **Header**, left of the gear. That button's heart is filled in *both* states — outline-vs-fill already means "favourited" on the Act blocks, so here colour carries the state instead. Always off on load — never persisted; a glance, not a mode. The button is inert while nothing is favourited, and unstarring the last Favourite drops out of Focus, so a fully-dimmed grid is never reachable. Dimmed Acts stay tappable.
_Avoid_: Dim mode, spotlight, favourites filter.

**Schedule**:
The whole view — the per-day grid with stages as columns and time on the y-axis.

**Header**:
The top band of the screen. Houses the app logo (a text wordmark, "Øyablikk", set in the display font in the **accent**), the currently-displayed day's label, and two buttons on the right: the **Focus** heart and the Settings gear, in that order — nothing else (no tabs, dots, or other day-switcher indicators). The day label carries the **Day standing** (ADR-0022): on today's pane the date is *replaced* by a filled accent chip reading `TODAY` — a sibling of the **Now line**'s pill, not a second accent word beside the wordmark, and it takes the date's place because the row is one non-wrapping line that will not hold both. On any other pane the date is a button back to today, marked by a muted left arrow; under standing `none` it is a plain, inert date. The header is the *always-on* carrier of today-ness, because the Now line is absent outside programme hours.

**Stage row**:
The strip just below the Header, naming the Schedule's columns. Static across Day swipes — only the acts slide horizontally underneath it.

**Settings**:
An overlay (a bottom sheet) reached via the button in the Header. Its default page holds the user-configurable display options — currently just the Stage filter — plus a link to the **About** page. Opening it always lands on the Settings page, wherever the sheet was last closed. The Stage filter must make the default-hidden stages (Trekanten, Biblioteket) discoverable: visible, unchecked, not buried.

**Stage filter**:
A section of the Settings overlay letting the user choose which Stages (columns) are visible. Hidden stages persist in `localStorage`; the remaining columns re-flow.

**About**:
A second page within the Settings overlay, reached by a link at the foot of the Settings page (the sheet swaps between the two). Holds a short first-person note on why the app exists, a statement that it is an unaffiliated fan project, the app's privacy statement (localStorage-only state plus the one analytics beacon), and install fallback instructions — the permanent home-screen how-to for both platforms, shown only when the app is not already running installed. Purely informational — no user-configurable options.

**Now line**:
A horizontal indicator drawn across every Day pane at the current Oslo time-of-day, marking where we currently are in the festival's daily clock. Visible whenever the current `Europe/Oslo` time-of-day falls within the union of all Days' active envelopes; hidden outside that window (e.g. middle of the night). Independent of the calendar date — the line appears year-round during festival hours, not only during the festival Days. On launch the app scrolls to centre the line whenever it is visible. Rendered in the **accent** colour (not Tons o'Clock's metal-red), with a small pill carrying the time. Only the line moves on the minute tick — a full re-render would snap a mid-swipe gesture back to the nearest pane; the line's two nodes are repositioned rather than rebuilt, so the standing fade does not replay on the minute. Its appearance follows the **Day standing** of the pane in view (ADR-0022): accent and 2px on today (and under standing `none`), muted grey and 1px on a past or future pane, where the pill is hidden outright rather than relabelled — `NOW` denotes something exact, and no substitute word does. It remains a single element on the Schedule container, never one per pane.

**Install prompt**:
A bottom sheet offering to add Øyablikk to the home screen (ADR-0014). Conditional, quiet and one-shot: it waits for first paint, fires at most once ever, only on a return visit (a *second Oslo calendar day*, not a reload), only on touch-primary iOS Safari or a Chromium that stashed `beforeinstallprompt`, never when already installed, and never at or after the hard cutoff (midnight Oslo on 16 August 2026). Users who dismiss it can still install via the **About** page's fallback instructions.

**Swipe nudge**:
A one-off motion hint on first visit that the Schedule navigates between Days by horizontal swipe (ADR-0017): a single slow peek toward a neighbouring Day, springing back to the same pane. Suppressed once the user has genuinely swiped, under `prefers-reduced-motion`, and whenever the **Install prompt** takes the launch moment — in which case it resumes on the next sheet-free launch. On the last Day it peeks backward, since a forward peek would stall against the scroll-snap boundary.

**Offline**:
The app is a PWA with a service worker precaching the build (ADR-0013), so it opens with no signal in Tøyenparken. Updates are silent: a freshly deployed bundle waits and activates on the next cold launch rather than reloading mid-session.

**Analytics beacon**:
The single anonymous page-view request to Cloudflare Web Analytics (ADR-0016) — the one deliberate exception to the otherwise no-third-party-requests rule (ADR-0011). No cookies, no fingerprinting, no cross-site tracking; stated verbatim on the **About** page. It rides Cloudflare's native (proxy-side) Web Analytics, so there is no beacon snippet in `index.html` and nothing to maintain in the app itself.

**Programme**:
The festival schedule as published by Øya in its **Sanity content lake** (project `sehba7v8`, dataset `production`), not by Appmiral. Equivalent to **Schedule** but used specifically when speaking about source-side data — i.e. inputs to the scraper. The scraper consumes the Programme; the app renders the Schedule.

**artistProgram**:
The source-side unit of a performance: the single `artistProgram` object on a Sanity `artist` document, carrying `programStartTime`, `programEndTime`, and references (`->`) to a `programDay` and a `programStage`. Becomes an **Act** after the transform resolves the refs and maps them onto app IDs. One artist document carries exactly one `artistProgram` (verified against the live dataset), which is why the artist `_id` alone identifies an Act. This replaces the retired Appmiral term **Performance**.

## Relationships

- A **Festival** has many **Days**.
- A **Day** has many **Stages** (column slots within that day's grid).
- A **Stage** on a **Day** has zero or more **Acts**.
- An **Act** belongs to exactly one **Stage** on one **Day**, features exactly one **Artist**, and may be marked as a **Favourite**.

## Flagged ambiguities

- "Slot" was used informally for the visual rectangle of an act on the grid — resolved: that rectangle is just an **Act**, rendered. Not a separate concept. (The word "slot" survives only in "performance slot", the stable identity component of a **Favourite**.)
- "Band" was used for the music group — resolved: avoided in favour of **Artist**.
- "Performance" (Appmiral's term) is retired — the source-side unit is now **artistProgram**; the app-side unit is **Act**.

## Example dialogue

> **Dev:** "When the user opens the **Stage filter** and hides Hagen, does that affect every **Day**?"
> **User:** "Yes — the filter is global. A hidden **Stage** is hidden across all **Days** until re-enabled. Trekanten and Biblioteket start hidden anyway; the other five start visible."
>
> **Dev:** "And if a starred **Artist** is dropped from the **Programme** in an overnight refresh?"
> **User:** "The **Favourite** is silently dropped — we key stars on the Sanity `_id`, not a grid position, so nothing else gets mis-starred."
