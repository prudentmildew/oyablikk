# Day standing: marking today across panes

New to Øyablikk. Amends [0008](./0008-live-mode-default-day-and-scroll.md), [0012](./0012-schedule-chrome-is-static-across-day-swipes.md) and [0017](./0017-first-visit-swipe-nudge.md) — see **Amendments** below.

Nothing in the app said which pane was **today**. [0008](./0008-live-mode-default-day-and-scroll.md) opens on today's pane and then goes quiet: the NOW line is a pure time-of-day marker drawn identically on every pane, and the header showed a plain date. Two swipes in, a user had no way to tell where today had gone, and no way back but to swipe until the date looked right.

We introduce **Day standing** — a Day's relation to the real-world Oslo date:

| Standing | Meaning |
|---|---|
| `past` | the Day is before today in Oslo |
| `today` | the Day *is* today in Oslo |
| `future` | the Day is after today in Oslo |
| `none` | **no** pane is today — the state for all but the festival days |

`dayStanding()` in `src/now.ts` is the whole comparison: ISO dates sort lexicographically in calendar order, so it is a string compare against `osloDate()`. `"none"` is not something a Day can be — it is the whole-app state, derived from the existing `todayFestivalDate()` returning `null`, and it puts everything below to sleep.

## The Now line marks today; the header always does

The line is the obvious place to carry this, and it is not enough on its own: the line only exists inside the programme envelope, 13:00–23:00, so it is absent for fourteen hours of every day — including the festival mornings when people open the app to plan. So the signal is carried in two places, and the header is the one that is always there.

**Now line** — one element still, on the schedule container, per [0012](./0012-schedule-chrome-is-static-across-day-swipes.md). Only its appearance varies, published as `data-now-standing` on the container and read entirely in CSS:

| Standing | Line | Pill |
|---|---|---|
| `today`, `none` | `--accent`, 2 px | `NOW` |
| `past`, `future` | `--muted`, 1 px | hidden |

Grey **and** thinner, because with the pill gone colour would be carrying the signal alone, on a phone held up in daylight in a park. The pill is hidden rather than relabelled: `NOW` denotes something exact, and no word we tried (`THEN`, `SOON`, `+2 DAYS`) denotes anything exact when attached to a time-of-day position on another Day. The dimmed line keeps its y-position, which is still worth reading on a neighbouring Day.

**Header** — the day label reflects the standing:

- `today` — the date is *replaced* by a filled accent chip reading `TODAY`, black-on-accent, deliberately the `NOW` pill's sibling rather than a second accent word beside the accent wordmark. The header is a single non-wrapping row and `TODAY · WED 12 AUG` does not fit at 1.4 rem on a 360 px screen; the date yields, since the phone shows it an inch higher.
- `past` / `future` — the date, wrapped in a button back to today with a `--muted` left arrow. Today is always reachable and never adjacent.
- `none` — the date, inert. Nothing to mark, nothing to return to.

Neighbouring panes keep their plain dates rather than reading `TOMORROW` / `YESTERDAY`: `TODAY` only carries weight while it is the exception.

## Consequences

The standing flips at the 50 % scroll boundary — where `notifyActiveDay` rounds — so it changes under the user's finger mid-drag, in step with the header label. A 180 ms fade on the line's colour and height keeps that from reading as a flicker; it is instant under `prefers-reduced-motion: reduce`. This is the cost of one shared line and is accepted: a per-pane line, drawn inside each pane, was the alternative and [0008](./0008-live-mode-default-day-and-scroll.md) rejected it for good reasons that still hold.

`renderNow()` now repositions its two nodes instead of removing and re-creating them, since a node replaced every 60 s tick would replay the fade on the minute. The minute tick also re-derives the standing, because it is a calendar fact that can change with no swipe at all — an app left open past midnight Oslo wakes on a pane that is no longer today.

## Amendments

- **[0008](./0008-live-mode-default-day-and-scroll.md)** rejected "NOW line bound to today, only during the festival" because the line is informative year-round. That still holds and is why `none` leaves the line at full accent: the line is *not* bound to today, it is merely **quieter away from it**, and only when there is a today to be away from. 0008 also pins scroll-to-now as once per session, so that automatic re-scrolling never steals the user's position; the back-to-today button re-runs it, which is the user asking, not the app deciding.
- **[0012](./0012-schedule-chrome-is-static-across-day-swipes.md)** holds structurally — the line is still one element outside `.days`, built once. It is no longer *visually* invariant across a swipe. The ADR's purpose (no per-pane chrome, no rebuild on swipe) is intact.
- **[0017](./0017-first-visit-swipe-nudge.md) §3** retires the nudge on a genuine gesture. The back-to-today jump changes the Day without being one, so it is exempt — the same discipline that keeps the nudge's own peek from retiring it.

## Considered options

- **Header only, leaving the Now line alone.** Rejected: the line is the app's most confident element and the pane-level cue people actually look at during a swipe. Cheaper, but half the signal.
- **Now line only.** Rejected: dark fourteen hours a day, including every festival morning.
- **`THEN` / `SOON` pill labels.** Rejected: imprecise against the data — `SOON` on a pane three days out, `THEN` on a clock position that denotes no particular past moment.
- **Relative day labels throughout** (`TOMORROW`, `YESTERDAY`, `+2 DAYS`). Rejected: with four panes, most labels become relative and `TODAY` stops standing out.
- **Colour-only dimming (accent at low opacity).** Rejected: still reads as green, and leaves colour as the sole carrier.
- **A day-position indicator in the header** (dots, tabs). Rejected: `CONTEXT.md` pins the header as logo, day label and two buttons, and that decision was not up for revisiting here.
