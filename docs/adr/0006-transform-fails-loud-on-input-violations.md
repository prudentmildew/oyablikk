# Transform fails loudly on input-assumption violations

_Adopted from tonsoclock ADR-0006. The fail-loud stance and the allowlisted-exclusion carve-out both carry over; the concrete triggers are re-expressed for the Sanity source._

The transform throws — rather than silently dropping data or guessing — whenever its raw input violates an assumption: a `programStage` `_ref` not in the configured stage map, a `programDay` `_ref` not in the configured day map, or an `artistProgram` whose end time is `<= ` its start time. Missing start/end times on a park act also throw. Each error names the offending value and a short remediation hint.

The reason is that the nightly refresh runs unattended. Once the workflow lands a green `schedule.json` on `main` and deploys, the schedule is on the user's phone. A "looks fine but silently missing five acts" output is strictly worse than producing nothing — yesterday's schedule, still live, is more correct than a freshly-deployed one that quietly lost a stage Øya added. This composes with the scrape step exiting non-zero on fetch/shape failure and the workflow's diff-gate declining to commit no-ops: at every stage the output is either correct or absent, never partial. The cost — a future edition adding a stage produces a red run instead of an auto-update — is the desired behaviour, because the right response to "an unmapped stage appeared" is a human decision about colour and column order.

## Amendment: non-park acts are an allowlisted exclusion, not unknown data

Øya's Sanity data includes club (Klubbøya) and after-hours (Øyanatt) acts, distinguished by the artist document's `type` field (see [0018](./0018-sanity-content-lake-as-programme-source.md) and PRD open question §10.2). These are **out of scope** for the park schedule. The transform maintains an explicit allowlist of excluded `type` values and drops those acts by design, logging a single `console.warn` naming what was dropped.

This is a deliberate carve-out from fail-loud, not a softening of it — mirroring the `none`-stage precedent in tonsoclock ADR-0006. An *unknown* stage/day ref still throws (the "a new park stage appeared, map it by hand" case); a *known* non-park `type` is excluded knowingly. The two cases are kept apart in code. Note the dependency: the exact `type` values that mark park vs non-park acts must be pinned (PRD §10.2) before this allowlist is written.
