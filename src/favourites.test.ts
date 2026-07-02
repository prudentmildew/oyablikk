// Favourites persistence (ADR-0019): act ids — Sanity artist `_id`s verbatim,
// never array indices — under `oya.favourites`. Stale ids self-heal on load.
import { beforeEach, describe, expect, it } from "vitest";
import { loadFavourites, saveFavourites, toggleFavourite } from "./favourites.ts";

const PROGRAMME_IDS = new Set(["artist-1", "artist-2", "artist-3"]);

beforeEach(() => {
  localStorage.clear();
});

describe("loadFavourites", () => {
  it("returns an empty set on fresh localStorage — nothing starred", () => {
    expect(loadFavourites(PROGRAMME_IDS)).toEqual(new Set());
  });

  it("round-trips a starred set under the oya.* namespace", () => {
    saveFavourites(new Set(["artist-1", "artist-3"]));
    expect(localStorage.getItem("oya.favourites")).not.toBeNull();
    expect(loadFavourites(PROGRAMME_IDS)).toEqual(new Set(["artist-1", "artist-3"]));
  });

  it("silently prunes a favourite whose act vanished from the data", () => {
    // A nightly refresh dropped artist-2 from the programme (ADR-0019).
    saveFavourites(new Set(["artist-1", "artist-2"]));
    const mutatedProgramme = new Set(["artist-1", "artist-3"]);
    expect(loadFavourites(mutatedProgramme)).toEqual(new Set(["artist-1"]));
  });

  it.each(["not json", '{"a":1}', "[1,2]"])(
    "falls back to nothing starred on a corrupt stored value (%s)",
    (raw) => {
      localStorage.setItem("oya.favourites", raw);
      expect(loadFavourites(PROGRAMME_IDS)).toEqual(new Set());
    },
  );

  it("writes the pruned set back — a dropped id cannot resurrect later", () => {
    // If the pruned id ever reappears in a future programme (or the key
    // survives into another edition), a stale star must not spring back.
    saveFavourites(new Set(["artist-1", "artist-2"]));
    loadFavourites(new Set(["artist-1"]));
    expect(JSON.parse(localStorage.getItem("oya.favourites") ?? "[]")).toEqual(["artist-1"]);
  });
});

describe("toggleFavourite", () => {
  it("stars, persists, unstars, persists", () => {
    const favourites = new Set<string>();
    toggleFavourite(favourites, "artist-1");
    expect(favourites).toEqual(new Set(["artist-1"]));
    expect(loadFavourites(PROGRAMME_IDS)).toEqual(new Set(["artist-1"]));

    toggleFavourite(favourites, "artist-1");
    expect(favourites).toEqual(new Set());
    expect(loadFavourites(PROGRAMME_IDS)).toEqual(new Set());
  });
});
