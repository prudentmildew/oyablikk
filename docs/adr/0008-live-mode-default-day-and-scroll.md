# Live mode: default-to-today, time-of-day NOW line, scroll-to-now on launch

_Adopted from tonsoclock ADR-0008. Behaviour is unchanged; only the edition's dates change (12–15 August 2026). The timezone stays `Europe/Oslo`._

On boot:

1. The active Day pane defaults to today when today is one of the four festival Days (Oslo time); otherwise to Wednesday (12 August 2026).
2. A NOW line is drawn at the current Oslo time-of-day, on every Day pane at the same y-coordinate (panes share a y-axis via `sharedOrigin`). It is a clock-time marker, independent of the calendar date.
3. The line is hidden when the current Oslo time-of-day falls outside the broadest envelope of festival activity across all four days (e.g. middle of the night). Inside that envelope it is visible all year round, not only during the four festival Days.
4. When visible, the viewport scrolls to centre it on first render — exactly once per session. Re-entries to a pane preserve the scroll position the user left.

The line is drawn in the new **accent** colour ([0007](./0007-concert-poster-visual-idiom.md)) with a "NOW" pill anchored at the time rail; position recomputes every 60 s. [0017](./0017-first-visit-swipe-nudge.md) qualifies the "untouched launch moment" this ADR protects: "untouched" means *not covered or blocked*, not *no motion at all* — a brief, non-blocking swipe nudge is permitted, sequenced after the scroll-to-now settle.

## Considered options

- **NOW line bound to today, only during the festival.** Rejected: the public app exists year-round and the line is informative outside the festival too; binding it to today's pane hid that signal for most of the year.
- **Line evaluated per-pane.** Rejected: visually inconsistent across panes during a horizontal swipe, and contradicts the cross-day comparison the shared y-axis was designed for.
- **Pill labelled `"NOW HH:MM"`.** Rejected: users have a clock on the same device; extra label weight for no real problem.
