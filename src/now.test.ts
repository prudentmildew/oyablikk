import { describe, expect, it } from "vitest";
import { osloDate, osloMinutes, todayFestivalDate } from "./now.ts";

describe("osloDate", () => {
  it("returns the Oslo date for a CEST noon instant on a festival day", () => {
    // UTC 10:00 = Oslo 12:00 CEST on Wed 12 August 2026
    expect(osloDate(new Date("2026-08-12T10:00:00Z"))).toBe("2026-08-12");
  });

  it("rolls forward to the next Oslo date when UTC is late evening", () => {
    // UTC 22:30 Tue 11 Aug = Oslo 00:30 Wed 12 Aug (CEST = UTC+2)
    expect(osloDate(new Date("2026-08-11T22:30:00Z"))).toBe("2026-08-12");
  });

  it("keeps the same Oslo date when UTC has not yet rolled past midnight Oslo", () => {
    // UTC 21:59 Mon 10 Aug = Oslo 23:59 Mon 10 Aug
    expect(osloDate(new Date("2026-08-10T21:59:00Z"))).toBe("2026-08-10");
  });

  it("handles a winter CET date (UTC+1, no DST in January)", () => {
    // UTC 23:30 on 2026-01-15 = Oslo 00:30 on 2026-01-16
    expect(osloDate(new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-16");
    // UTC 22:30 on 2026-01-15 = Oslo 23:30 on 2026-01-15 (still same day)
    expect(osloDate(new Date("2026-01-15T22:30:00Z"))).toBe("2026-01-15");
  });
});

describe("osloMinutes", () => {
  it("returns 720 (12:00) for UTC 10:00 on a CEST date", () => {
    expect(osloMinutes(new Date("2026-08-12T10:00:00Z"))).toBe(720);
  });

  it("returns 90 (01:30) for UTC 23:30 on a CEST date (wraps past midnight)", () => {
    expect(osloMinutes(new Date("2026-08-12T23:30:00Z"))).toBe(90);
  });

  it("returns 120 (02:00) for UTC 00:00 on a CEST date", () => {
    expect(osloMinutes(new Date("2026-08-12T00:00:00Z"))).toBe(120);
  });

  it("returns 0 for an instant exactly at Oslo midnight", () => {
    // 00:00 Oslo CEST on 12 August = UTC 22:00 on 11 August
    expect(osloMinutes(new Date("2026-08-11T22:00:00Z"))).toBe(0);
  });
});

describe("todayFestivalDate", () => {
  // Five programme days (Tue–Sat) — the day count is data-driven, never four.
  const festival = ["2026-08-11", "2026-08-12", "2026-08-13", "2026-08-14", "2026-08-15"];

  it("returns the matching festival date when today (Oslo) is one of them", () => {
    // UTC 10:00 on 13 Aug = Oslo 12:00 on 13 Aug
    expect(todayFestivalDate(festival, new Date("2026-08-13T10:00:00Z"))).toBe("2026-08-13");
  });

  it("matches the Tuesday opening day", () => {
    expect(todayFestivalDate(festival, new Date("2026-08-11T18:00:00Z"))).toBe("2026-08-11");
  });

  it("returns null when Oslo date is not in the list", () => {
    // 1 July 2026 — well before the festival
    expect(todayFestivalDate(festival, new Date("2026-07-01T10:00:00Z"))).toBeNull();
  });

  it("returns null for an empty festivalDates array", () => {
    expect(todayFestivalDate([], new Date("2026-08-12T10:00:00Z"))).toBeNull();
  });

  it("returns null when the festival list contains dates but none match today", () => {
    // Now is a day later than any festival date
    expect(todayFestivalDate(festival, new Date("2026-08-16T10:00:00Z"))).toBeNull();
  });
});
