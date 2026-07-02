# No clash feature

_Adopted from tonsoclock ADR-0010, which removed the clash feature after user testing (superseding its own ADR-0001 and ADR-0002). Øyablikk starts from that conclusion: it never implements clash highlighting at all._

Tons o'Clock once had a **Clash highlight** — an opt-in Setting drawing striped bands over intervals where Acts on different visible Stages overlapped — backed by a client-side detection algorithm. Test users reported it provided no practical value in use, so it was removed entirely: the checkbox, the setting and its persistence, the rendered bands, the algorithm, and the **Clash** / **Clash highlight** glossary terms.

Øyablikk carries over that verdict rather than the feature. There is no clash detection, no clash setting, and no clash vocabulary in `CONTEXT.md`. This is **not revisited even with Favourites** ([0019](./0019-favourites.md)) — starring an act is about *my* lineup, not about surfacing conflicts between acts (PRD §2).

Should a clash feature ever be reconsidered, the starting point worth revisiting is tonsoclock's original reasoning: clashes depend on the runtime Stage filter (which stages are visible), so detection must live client-side — it is unknowable upstream in the data.
