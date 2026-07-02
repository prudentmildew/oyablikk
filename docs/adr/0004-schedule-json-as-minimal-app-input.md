# `schedule.json` is the minimal app input, produced by a transform from raw

_Adopted from tonsoclock ADR-0004, unchanged. Preserving this shape verbatim is what lets Øyablikk's entire rendering layer port from Tons o'Clock unmodified._

`data/schedule.json` is the only data file the app reads, and it is a generated artifact written by the transform from `data/programme.raw.json` plus a small hardcoded festival-edition config (stage-ref map, day-ref → date map). It is committed so its diffs are reviewable between scrapes. Its shape is reduced to exactly what `src/` consumes:

- `stages[]` with `id` / `name` / `color` / `textColor`;
- `days[]` with `date`, `start_min`, `end_min`, and `acts` keyed by stage id;
- acts as `{ name, start, end, start_min, end_min }`.

The `_min` fields are kept though derivable from the `HH:MM` strings — they are consumed on every render by the layout code, and a machine-generated file removes the only real risk of redundant fields (hand-edit drift). The human-readable day label is formatted from `date` via `Intl.DateTimeFormat`, so no pre-formatted `label` is stored. The on-disk JSON matches the in-memory `Schedule` type 1:1, so no hydration step is needed.
