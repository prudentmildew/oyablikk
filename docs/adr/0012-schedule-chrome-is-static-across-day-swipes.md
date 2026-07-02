# Schedule chrome is static across day swipes

_Adopted from tonsoclock ADR-0012, unchanged._

The Stage row, time rail, and NOW line are identical on every Day — the same park stages, a time envelope shared across all days via `sharedOrigin`, and a single Oslo "now" at the same y-coordinate on every pane ([0008](./0008-live-mode-default-day-and-scroll.md)). Rendering them per-Day means they slide off and back in during a horizontal swipe even though nothing about them changes. We render them once at the Schedule level instead. Each Day renders only its act blocks; the Schedule is a single vertically-scrolling container, and the Days are a horizontally-swipeable sub-region inside it.

## Consequences

- The day-pane reduces to act-block rendering. The rail, the Stage row, and the NOW line live at the schedule-view level.
- Vertical and horizontal scroll are decoupled: one container holds the Y position.
- The Stage filter drives the column count; both the Stage row and each Day's act-grid must use the same grid template and gap so columns align frame-for-frame across the swipe. (With five stages and two default-hidden, the visible column count varies — the shared template must track it.)
- A swipe reads as content-swap-under-a-static-frame rather than whole-pane translation — the eye no longer re-acquires the column labels on every swipe.

## Considered options

- **Per-day chrome with JS-driven fixed-position overlays.** Rejected: requires scroll listeners to keep the rail aligned, prone to jank, heavier machinery for the same visual result.
- **Pull only the Stage row out, leave rail and NOW line per-Day.** Rejected: during a swipe the rail and line still translate even though they look identical on both sides. Either commit to a static frame or don't.
