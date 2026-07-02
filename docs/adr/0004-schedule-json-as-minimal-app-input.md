# `schedule.json` is the minimal app input, produced from the Sanity source

_Adopted from tonsoclock ADR-0004. Preserving this shape is what lets Øyablikk's entire rendering layer port from Tons o'Clock unmodified. **Amended**: one `id` field is added per act (required by Favourites, [0019](./0019-favourites.md)), and the file is emitted by the single fetch script ([0020](./0020-single-script-pipeline.md)) rather than a separate transform reading a raw mirror._

`data/schedule.json` is the only data file the app reads, and it is a generated artifact written by the fetch script from Øya's Sanity source plus a small hardcoded festival-edition config (stage-ref map, day-ref → date map). It is committed so its diffs are reviewable between fetches. Its shape is reduced to exactly what `src/` consumes:

- `stages[]` with `id` / `name` / `color` / `textColor`;
- `days[]` with `date`, `start_min`, `end_min`, and `acts` keyed by stage id;
- acts as `{ id, name, start, end, start_min, end_min }`.

**The act `id` is the Sanity artist `_id`, verbatim.** One artist document carries exactly one `artistProgram` object in Øya's model, so the `_id` is a collision-free performance identity — maximally stable under nightly mutations (survives time shifts, stage moves, and day moves). The fetch script's duplicate-id guard ([0020](./0020-single-script-pipeline.md)) turns any future remodelling into a red run. Favourites ([0019](./0019-favourites.md)) key on this field; the rendering layer ignores it.

The `_min` fields are kept though derivable from the `HH:MM` strings — they are consumed on every render by the layout code, and a machine-generated file removes the only real risk of redundant fields (hand-edit drift). The human-readable day label is formatted from `date` via `Intl.DateTimeFormat`, so no pre-formatted `label` is stored. The on-disk JSON matches the in-memory `Schedule` type 1:1, so no hydration step is needed.
