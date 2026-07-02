# Transform fails loudly on input-assumption violations

_Adopted from tonsoclock ADR-0006. The fail-loud stance and the allowlisted-exclusion carve-out both carry over; the concrete triggers are re-expressed for the Sanity source. "The transform" now means the pure `toSchedule()` core of the single fetch script ([0020](./0020-single-script-pipeline.md))._

The transform throws — rather than silently dropping data or guessing — whenever its raw input violates an assumption: a `programStage` `_ref` not in the configured stage map, a `programDay` `_ref` not in the configured day map, an `artistProgram` whose end time is `<= ` its start time, or two acts sharing an `id` ([0020](./0020-single-script-pipeline.md)'s duplicate-id guard). Missing start/end times on a park act also throw. Each error names the offending value and a short remediation hint.

The reason is that the nightly refresh runs unattended. Once the workflow lands a green `schedule.json` on `main` and deploys, the schedule is on the user's phone. A "looks fine but silently missing five acts" output is strictly worse than producing nothing — yesterday's schedule, still live, is more correct than a freshly-deployed one that quietly lost a stage Øya added. This composes with the scrape step exiting non-zero on fetch/shape failure and the workflow's diff-gate declining to commit no-ops: at every stage the output is either correct or absent, never partial. The cost — a future edition adding a stage produces a red run instead of an auto-update — is the desired behaviour, because the right response to "an unmapped stage appeared" is a human decision about colour and column order.

## Amendment: the `type` field gets a two-sided allowlist

Øya's Sanity data includes club (Klubbøya) and after-hours (Øyanatt) acts alongside park acts, distinguished by the artist document's `type` field. **The values are pinned (verified against the live dataset, 2 July 2026): `festival` = park act (include); `club` and `oyanatt` = non-park (exclude); every 2026 artist carries one of the three.** This resolves PRD open question §10.2.

The allowlist is **two-sided**: known park values are included; known non-park values are excluded by design, logging a single `console.warn` naming what was dropped; **an unknown `type` value throws**. Silently *including* an unknown type could put a film talk in a stage column; silently *excluding* one could vanish a legitimate new act category — the exact "quietly lost five acts" failure this ADR exists to prevent. A new value means a red run and a one-line human decision about which list it joins.

This is a deliberate carve-out from fail-loud, not a softening of it — mirroring the `none`-stage precedent in tonsoclock ADR-0006 (include / allowlisted-exclude / unknown-throws triad). An *unknown* stage/day ref still throws; a *known* non-park `type` is excluded knowingly. The two cases are kept apart in code.
