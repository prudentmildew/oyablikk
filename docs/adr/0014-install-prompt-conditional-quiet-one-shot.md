# Install prompt is conditional, quiet, and one-shot

_Adopted from tonsoclock ADR-0014. Behaviour is unchanged; only the hard cutoff date moves to the Øya edition._

Surface an "Add it to your home screen" bottom sheet on a user's **second-calendar-day** visit — never on the first visit and never twice. The sheet matches the Settings overlay's visual language and dismiss conventions. Two variants by platform: on iOS Safari, instructional copy with a Share-icon glyph; on Android Chrome/Edge, an Install button bound to a stashed `beforeinstallprompt` event. A permanent fallback section at the bottom of the About page covers users who dismissed and later reconsider.

**Øya delta — the cutoff.** After the festival ends, the sheet never fires again. The hard cutoff is **`2026-08-16T00:00 +02:00` (`Europe/Oslo`)** — the midnight after the last festival day (15 August). After it the sheet code path is dead but the About-page fallback stays.

The primary benefit named in the pitch is offline use on-site — made real by [0013](./0013-service-worker-silent-auto-update.md). We can't measure conversion ([0016](./0016-cloudflare-web-analytics-supersedes-no-third-party.md) only counts page views), so "second calendar day" was chosen on intent grounds: a reload in one sitting doesn't count; a return the next day does. First-visit users see the Schedule untouched, preserving [0008](./0008-live-mode-default-day-and-scroll.md)'s launch moment.

## Consequences

- Two persisted keys: `oya.firstVisitDate` (Oslo date string, set on first run) and `oya.installPromptShown` (presence marker set when the sheet shows). The second makes "one-shot / never twice" true across sessions. Both are client-only; the About privacy note stays accurate.
- iPadOS 13+ Safari reports a desktop `Macintosh` UA; detection treats `Macintosh` + `navigator.maxTouchPoints > 1` as iPad (a real Mac reports 0), routing iPad Safari to the `ios` variant.
- The trigger optimises for the at-home planner, not the user whose first contact is on-site (who sees no sheet that day). Accepted: visit 1 cannot be both left calm for the now-reader and used to pitch install; the always-reachable About-page fallback is the same-day mitigation.
