import { type TimeOrigin, pxFromMin } from "./layout.ts";
import type { Day, Stage } from "./schedule.ts";

export type RenderDayOptions = {
  day: Day;
  visibleStages: Stage[];
  origin: TimeOrigin;
  pxPerMinute: number;
  /** Starred act ids (ADR-0019). Omitted = nothing starred. */
  favourites?: ReadonlySet<string>;
};

export function renderDay(opts: RenderDayOptions): HTMLElement {
  const { day, visibleStages, origin, pxPerMinute, favourites } = opts;
  const section = document.createElement("section");
  section.className = "day";
  section.dataset.dayDate = day.date;

  const columns = document.createElement("div");
  columns.className = "columns";

  const heightPx = (origin.endMin - origin.startMin) * pxPerMinute;

  for (const stage of visibleStages) {
    const colEl = document.createElement("div");
    colEl.className = "column";
    colEl.dataset.stageId = stage.id;
    colEl.style.setProperty("--stage-color", stage.color);
    colEl.style.setProperty("--stage-text-color", stage.textColor);
    colEl.style.height = `${heightPx}px`;

    for (const act of day.acts[stage.id] ?? []) {
      const actEl = document.createElement("div");
      actEl.className = "act";
      // Stable act identity (ADR-0004) — the hook Favourites keys on.
      actEl.dataset.actId = act.id;
      actEl.style.top = `${pxFromMin(act.start_min, origin, pxPerMinute)}px`;
      actEl.style.height = `${(act.end_min - act.start_min) * pxPerMinute}px`;

      const start = document.createElement("span");
      start.className = "act-start";
      start.textContent = act.start;
      const name = document.createElement("span");
      name.className = "act-name";
      name.textContent = act.name;
      const end = document.createElement("span");
      end.className = "act-end";
      end.textContent = act.end;
      actEl.append(start, name, end);

      // Starred = highlighted in place (ADR-0019): glyph + louder block,
      // never dimming or moving the others.
      if (favourites?.has(act.id)) {
        actEl.classList.add("starred");
        const star = document.createElement("span");
        star.className = "act-star";
        star.textContent = "★";
        actEl.appendChild(star);
      }

      colEl.appendChild(actEl);
    }

    columns.appendChild(colEl);
  }

  section.appendChild(columns);
  return section;
}
