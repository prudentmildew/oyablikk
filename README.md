# Øyablikk

A schedule for [Øya Festivalen](https://oyafestivalen.no) 2026 that answers the
only question anyone ever actually has in Tøyenparken: *who is on, where, and
have I already missed them?*

Live at **[oyablikk.no](https://oyablikk.no)**.

## Why this exists

The official programme is a fine and handsome thing, and it is also a website,
which means that at eight o'clock on a Friday evening — surrounded by nine
thousand people all clutching the same overheating telephone at the same
overburdened cell tower — it is a rumour rather than a document.

Øyablikk is roughly forty kilobytes of stubbornness. It installs to your home
screen, caches itself, and works with no signal whatsoever, which is the state
your telephone will be in at precisely the moment you need to know whether The
Cure have started. One screen, swipe for the day, stages as columns, and a
green line that says *you are here* on the festival's daily clock.

## What it does

- **Days, by swipe.** Wednesday to Saturday, one pane each, going sideways.
- **Stages as columns**, each with its own colour, checked to be legible and
  colour-blind-safe rather than merely pretty.
- **A NOW line** at the current Oslo time, so the schedule is a map of the
  present rather than an archive of good intentions.
- **Favourites.** Tap an act, it gets a heart. Tap the heart in the header and
  everything you didn't star politely dims — the "yes, but what am *I* doing"
  view.
- **A stage filter**, for those with no interest in the talks tent, and for
  those with interest in *nothing but* the talks tent.
- **Offline, installable, and quiet.** No cookies, no tracking, no accounts, no
  newsletter, one anonymous page-view beacon and not a byte more.

Notably absent: a clash detector. You are a grown adult and can work out for
yourself that two things at the same time are two things at the same time.

## Getting it running

You will need [pnpm](https://pnpm.io) and Node 24 or better.

```sh
pnpm install
pnpm dev            # a local copy, on a port of Vite's choosing
pnpm test           # the suite
pnpm build          # both typechecks, then the bundle
```

There is a pre-commit hook that runs lint, both typechecks and the tests. It is
opt-in per clone, on the honour system:

```sh
git config core.hooksPath .githooks
```

Do enable it. It has saved this repository from itself more than once.

## Where the programme comes from

Øya publishes its programme into a [Sanity](https://sanity.io) content lake.
`scripts/fetch-schedule.ts` asks politely, `scripts/to-schedule.ts` turns the
answer into the small flat shape the app wants, and the result lands in
`data/schedule.json`, which is committed like any other source file.

Do **not** edit that file by hand. It is generated, it is overwritten nightly by
a robot at one in the morning UTC, and your careful corrections will vanish
without ceremony or apology.

Everything that changes between festival editions — the stage list, the day
mappings, the palette — lives in `scripts/edition-config.ts`. That is deliberate.
Next year, that is the file you open.

## Deployment

Push to `main` and it goes live, which is either delightfully frictionless or
mildly terrifying depending on your temperament and the hour. See
`docs/runbook-ship.md` for the ceremonial bits, and `docs/adr/` for the record of
every decision anyone thought worth defending in writing.

## The small print

This is an unaffiliated fan project. Øya Festivalen neither endorses it nor,
so far as anyone can tell, knows about it. All schedule data belongs to them;
the mistakes belong to me.

If the schedule is wrong, it is wrong upstream, and you should trust the stage
in front of you over the telephone in your hand.
