# Concert-poster visual idiom; no theme toggle

_Adopted from tonsoclock ADR-0007. The idiom and the no-toggle stance are unchanged; the concrete palette is Øya's own and is chosen fresh._

The app's only realistic use context is at the festival — on a phone, in direct sun, often in a crowd. We ship a single design tuned for that case: black background, saturated per-stage colour fills, and a flipped type hierarchy where the Act name dominates and the Day label subordinates. This is a usability decision (phone, daylight, outdoor), independent of genre. There is no theme toggle and no light theme.

**Øya delta — the palette is new.** Tons o'Clock used a pink-red / amber / cyan / violet spread against a metal-red accent. Øyablikk has **five** park stages (Amfiet, Sirkus, Vindfruen, Hagen, Klubben) and its own identity: the five stage colours and the accent are chosen fresh, colour-blind-safe **as a set of five**, glance-distinct at column width, nodding to Øya's greener/artsier character rather than metal-red. The NOW line and pill use the new accent. The concrete hex values are a deferred design task (PRD §10.5), not a blocker for structure.

## Considered options

- **A togglable "loud" theme alongside a calm default.** Rejected: a toggle relies on the user changing modes precisely when they are least able to find Settings, and shipping a calm default means the only case that matters — at-festival, in sun — gets the worse design out of the box.
- **Deriving per-stage text colour from a runtime contrast function.** Rejected: brittle when the palette is later tweaked; authoring `textColor` alongside `color` in `schedule.json` is one extra field per stage with no real downside.
