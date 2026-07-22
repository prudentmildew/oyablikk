---
status: accepted
---

# Focus: a transient dim of the unstarred, narrowing 0019

_New decision, original to Øyablikk. Narrows [0019](./0019-favourites.md)._

[0019](./0019-favourites.md) reads "Unstarred acts are **never dimmed**" and rejects a favourites-only filter outright. What it rejected was a **permanent filter mode**: hiding unstarred acts would answer "my lineup" at the cost of "who's on now on the other stages", which is the app's whole reason to exist.

**Focus** is a different thing wearing a similar coat. A heart button in the Header dims unstarred acts to 25% so the user's own lineup pops out of a dense grid. It is opt-in, off on every load, and one tap from the full-strength grid. The rejected mode's cost does not apply: the other stages stay on screen, in position, still readable if looked at.

## Decisions

- **Transient, never persisted.** Focus resets to off on every load. Persisting it would recreate exactly what 0019 rejected, just slower — a user who toggles it once at 14:00 and pockets the phone reopens at 19:00 into a half-dimmed grid, having forgotten why.
- **Opacity, not grayscale.** Unstarred acts drop to 25% opacity. Grayscale would keep them readable but collapse six deliberately colour-blind-safe Stage colours into six near-identical greys — destroying the column-identity signal rather than merely quieting it.
- **Inert with nothing starred.** The Header button renders `disabled` while the favourites set is empty. It stays visible (discoverable) but cannot produce the all-dimmed, meaningless screen a new user would otherwise reach on their first curious tap. Hiding it instead would shift the gear sideways under the user's thumb the moment they star their first act.
- **Emptying the set drops out of Focus.** Unstarring the last favourite while Focus is on would dim every act *and* disable the button that turns it off. The state machine exits Focus instead, so that dead end is unreachable rather than merely escapable.
- **The Header heart is filled in both states; colour carries the state.** `--fg` off, `--accent` on, plus `aria-pressed`. Outline-vs-fill already means exactly one thing app-wide — *this act is favourited* — and overloading it in the Header, the first chrome a user reads, would give one visual pair two meanings.
- **Dimmed acts stay tappable.** Starring a dimmed act lights it up immediately; Focus changes prominence, never interactivity.
- **The whole feature is one class plus one CSS rule.** Focus toggles a class on the Schedule container; the dim lives in `.schedule.focus .act:not(.starred)`. No re-render, no state threaded through the render path.

## Considered options

- **Persisted Focus**, consistent with the Stage filter. Rejected above — persistence is what turns a glance into the rejected mode.
- **Outline heart off / filled on in the Header.** Rejected: two meanings for one visual pair.
- **Blocking the unstar of a last favourite while Focus is on.** Rejected — silently ignoring a tap reads as broken.
- **Keeping the button live on an empty set** so the all-dimmed screen stays escapable. Rejected in favour of making it unreachable.

## Consequences

- 0019's "never dim" clause now reads "never dim *by default*". The default view is unchanged: full-strength grid, starred acts popping in place.
- Focus adds no persisted state, so there is nothing to version, migrate, or prune.
- The Favourite glyph is a heart (outlined on every act, filled when starred), replacing 0019's star, and is shared with this Header button.
