---
status: accepted
---

# First-visit swipe nudge: teaching horizontal Day navigation by motion

_Adopted from tonsoclock ADR-0017, unchanged (the localStorage key is namespaced `oya.hasSwiped`)._

The Schedule navigates between Days by horizontal swipe (native scroll-snap across full-width panes), but on launch a user lands on one full-screen Day grid with no edge cue that more Days exist sideways. The chrome is deliberately bare — the Header carries no tabs or dots (`CONTEXT.md`), and [0012](./0012-schedule-chrome-is-static-across-day-swipes.md) keeps the stage columns static across swipes. So nothing on screen advertises the gesture.

We teach it by **motion, once**: on a user's first visits, the Day panes animate a short peek toward an adjacent Day and spring back. No text, no permanent chrome, no persistent indicator. Concretely:

1. **Adaptive direction.** The nudge peeks toward the next Day; if the user launched on the last Day (Saturday, 15 August), it peeks toward the previous Day instead — always a real, productive swipe, never pushing against a scroll-snap boundary.
2. **After the launch settle, not during it.** It fires only after the scroll-to-now has painted. One axis of motion at a time.
3. **Until first real swipe, not a fixed one-shot.** An `oya.hasSwiped` flag (localStorage) gates it: the nudge plays on each launch while false, and the first genuine swipe sets it true forever. The nudge springs back to the same pane, so it never triggers the flag itself.
4. **Reduced motion opts out entirely.** Under `prefers-reduced-motion: reduce` the nudge is skipped with no fallback.
5. **Yields to the install sheet.** On a return visit where the user still hasn't swiped *and* the install sheet ([0014](./0014-install-prompt-conditional-quiet-one-shot.md)) qualifies, the sheet wins and the nudge is suppressed that visit.
6. **Tunable feel, default `slowLearner`.** A deeper (~20% of width, capped 72 px), slower (~900 ms) single peek, chosen so a distracted first-timer still registers it — discoverability judged to matter more than restraint for a one-time, self-cancelling hint.

This **reinterprets [0008](./0008-live-mode-default-day-and-scroll.md)**: "untouched launch moment" is read as *not covered or blocked*, not *no motion at all* — a brief, non-blocking peek obscures nothing and blocks no interaction. It is not a licence for blocking overlays in that slot.

## Consequences

- A new `oya.hasSwiped` key joins the client-side state (`oya.firstVisitDate`, `oya.installPromptShown`); all stay client-only.
- The launch sequence coordinates three behaviours on visit boundaries: scroll-to-now (every visit), the swipe nudge (until first swipe, deferring to the sheet), and the install sheet (return visits). On Android the install decision may still be pending at nudge time (`beforeinstallprompt` often fires after first paint), so when the decision is pending the nudge waits a short grace window before re-checking, then plays only if no sheet opened.
