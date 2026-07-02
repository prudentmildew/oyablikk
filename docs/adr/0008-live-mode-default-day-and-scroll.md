# Live mode: default-to-today, time-of-day NOW line, scroll-to-now on launch

_Adopted from tonsoclock ADR-0008. Behaviour is unchanged; the edition's dates change, and the day count becomes data-driven. The timezone stays `Europe/Oslo`._

**Øya delta — five Days, N panes.** The 2026 park programme spans **five** days (Tue 11 – Sat 15 August; the Tuesday holds a single opening act — verified against the live dataset, closing what was an undiscovered gap in the PRD's four-day framing). The app renders **one pane per day present in `schedule.json`** (`days.length`) rather than a hardcoded four. The out-of-festival fallback pane is **Wednesday 12 August** — the first *full* programme day, configured explicitly in the edition config rather than derived as `days[0]`, so the year-round default view is a real schedule, not the one-act Tuesday.

On boot:

1. The active Day pane defaults to today when today is one of the festival Days (Oslo time); otherwise to the configured fallback (Wednesday 12 August 2026).
2. A NOW line is drawn at the current Oslo time-of-day, on every Day pane at the same y-coordinate (panes share a y-axis via `sharedOrigin`). It is a clock-time marker, independent of the calendar date.
3. The line is hidden when the current Oslo time-of-day falls outside the broadest envelope of festival activity across all days (e.g. middle of the night). Inside that envelope it is visible all year round, not only during the festival Days.
4. When visible, the viewport scrolls to centre it on first render — exactly once per session. Re-entries to a pane preserve the scroll position the user left.

The line is drawn in the new **accent** colour ([0007](./0007-concert-poster-visual-idiom.md)) with a "NOW" pill anchored at the time rail; position recomputes every 60 s. [0017](./0017-first-visit-swipe-nudge.md) qualifies the "untouched launch moment" this ADR protects: "untouched" means *not covered or blocked*, not *no motion at all* — a brief, non-blocking swipe nudge is permitted, sequenced after the scroll-to-now settle.

## Considered options

- **NOW line bound to today, only during the festival.** Rejected: the public app exists year-round and the line is informative outside the festival too; binding it to today's pane hid that signal for most of the year.
- **Line evaluated per-pane.** Rejected: visually inconsistent across panes during a horizontal swipe, and contradicts the cross-day comparison the shared y-axis was designed for.
- **Pill labelled `"NOW HH:MM"`.** Rejected: users have a clock on the same device; extra label weight for no real problem.
