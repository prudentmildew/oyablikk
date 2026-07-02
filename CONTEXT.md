# Øyablikk — Øya Festivalen Schedule App

A mobile web app showing the Øya Festivalen 2026 park programme. Single screen, four swipeable days, park stages as columns, a NOW line at the current Oslo time, and tap-to-star **Favourites**. Sibling of [Tons o'Clock](https://tonsoclock.no) (`prudentmildew/tonsoclock`), copied and adapted from its codebase; this glossary is adopted from Tons o'Clock's `CONTEXT.md` with the Øya-edition changes noted inline.

## Language

**Festival**:
The event being scheduled — Øya Festivalen 2026, Tøyenparken, Oslo, 12–15 August (Wed–Sat). Only the **park programme** is in scope; Klubbøya club shows and Øyanatt after-hours sets are a different product (they cross midnight and sprawl across one-off venues).

**Day**:
One of the four festival dates (Wed–Sat). The Schedule shows one Day's acts at a time; swiping horizontally switches the visible Day. Park hours run roughly 11:00–23:00 — acts never cross midnight, preserving the transform's `end > start` invariant.

**Stage**:
A physical performance location in the park. Five exist: **Amfiet, Sirkus, Vindfruen, Hagen, Klubben**. Each Stage owns a vertical column in the Schedule, distinguished by its **Stage colour**. The columns are shared across all Days — only the acts inside them change as the Day changes. **Amfiet, Sirkus, Vindfruen** are visible by default; **Hagen and Klubben are default-hidden** (opt-in via the Stage filter) to keep three glanceable columns.

**Stage colour**:
A per-Stage hex colour used to distinguish columns visually. An app convention — not part of Øya's brand identity. The five Stage colours are chosen by us to be colour-blind-safe as a set and glance-distinct at column width, nodding to Øya's greener/artsier identity. The concrete five values (and the accent) are a deferred design task, not yet decided.

**Act**:
A single artist's performance on one stage over a bounded time window. What the JSON `acts[]` entries represent.
_Avoid_: Slot, set, gig, performance.

**Artist**:
The band or performer named in an act. The `name` field of an act; on the source side, a Sanity `artist` document.
_Avoid_: Band, performer.

**Favourite**:
A per-user mark on an **Act**, toggled by tapping the act block. Persisted in `localStorage` (`oya.favourites`) keyed by stable act identity (the Sanity artist `_id` plus performance slot, never an array index) so a nightly data refresh never mis-attributes a star. A starred Act is highlighted in place in the grid — never dimmed, hidden, or moved. A favourite whose Act disappears from the data is silently dropped. There is no favourites-only filter; the grid always shows the full programme.

**Schedule**:
The whole view — the per-day grid with stages as columns and time on the y-axis.

**Header**:
The top band of the screen. Houses the app logo, the currently-displayed day's label, and the Settings button — nothing else (no tabs, dots, or other day-switcher indicators).

**Stage row**:
The strip just below the Header, naming the Schedule's columns. Static across Day swipes — only the acts slide horizontally underneath it.

**Settings**:
An overlay (a bottom sheet) reached via the button in the Header. Its default page holds the user-configurable display options — currently just the Stage filter — plus a link to the **About** page. The Stage filter must make the two default-hidden stages (Hagen, Klubben) discoverable: visible, unchecked, not buried.

**Stage filter**:
A section of the Settings overlay letting the user choose which Stages (columns) are visible. Hidden stages persist in `localStorage`; the remaining columns re-flow.

**About**:
A second page within the Settings overlay, reached by a link at the foot of the Settings page (the sheet swaps between the two). Holds a short first-person note on why the app exists, a statement that it is an unaffiliated fan project, the app's privacy statement (localStorage-only state plus the one analytics beacon), and install fallback instructions. Purely informational — no user-configurable options.

**Now line**:
A horizontal indicator drawn across every Day pane at the current Oslo time-of-day, marking where we currently are in the festival's daily clock. Visible whenever the current `Europe/Oslo` time-of-day falls within the union of all four Days' active envelopes; hidden outside that window (e.g. middle of the night). Independent of the calendar date — the line appears year-round during festival hours, not only during the four festival Days. On launch the app scrolls to centre the line whenever it is visible. Rendered in the new **accent** colour (not metal-red).

**Programme**:
The festival schedule as published by Øya in its **Sanity content lake** (project `sehba7v8`, dataset `production`), not by Appmiral. Equivalent to **Schedule** but used specifically when speaking about source-side data — i.e. inputs to the scraper. The scraper consumes the Programme; the app renders the Schedule.

**artistProgram**:
The source-side unit of a performance: the `artistProgram` object on a Sanity `artist` document, carrying `programStartTime`, `programEndTime`, and references (`->`) to a `programDay` and a `programStage`. Becomes an **Act** after the transform resolves the refs and maps them onto app IDs. One artist can have multiple `artistProgram` entries. This replaces the retired Appmiral term **Performance**.

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
> **User:** "Yes — the filter is global. A hidden **Stage** is hidden across all four **Days** until re-enabled. Hagen and Klubben start hidden anyway; Amfiet, Sirkus and Vindfruen start visible."
>
> **Dev:** "And if a starred **Artist** is dropped from the **Programme** in an overnight refresh?"
> **User:** "The **Favourite** is silently dropped — we key stars on the Sanity `_id`, not a grid position, so nothing else gets mis-starred."
