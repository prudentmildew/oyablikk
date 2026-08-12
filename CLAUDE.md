# CLAUDE.md

## The project

Øyablikk — a mobile web app for the Øya Festivalen 2026 park programme. Vanilla
TypeScript + Vite, no UI framework; the app is a single screen of swipeable day
panes. Deployed to <https://oyablikk.no> via GitHub Pages. Read `CONTEXT.md` for
the domain vocabulary before touching feature code.

The repo is public, the site is live, and the 2026 festival runs 12–15 August.
Pushes to `main` deploy, so treat `main` as production.

Shape of the repo:

- `src/` — the app (DOM built imperatively, `styles.css`, service worker `sw.ts`),
  with `*.test.ts` files sitting beside what they test. Features are one module
  each: `schedule-view`, `day-pane`, `now`, `favourites`, `stage-filter`,
  `settings-sheet`, `install-sheet`/`install-detection`, `swipe-nudge`.
- `scripts/` — the data pipeline: `fetch-schedule.ts` (thin IO shell) around the
  pure `to-schedule.ts`, plus `edition-config.ts`, the one file that changes
  between festival editions (stage/day `_ref` maps, palette, default-hidden
  stages, `FALLBACK_DAY`). `validate-palette.ts` guards the colour contract.
- `data/schedule.json` — the committed, generated app input. Never hand-edit it;
  re-run the fetch. A nightly workflow refreshes it unattended.
- `public/` — icons, `manifest.webmanifest`, `og.png`. Self-hosted, no CDN
  (ADR-0011).
- `docs/adr/` — architecture decisions, indexed in `docs/adr/README.md`. Code
  comments reference them by number; keep doing that. `docs/PRD.md` holds the
  product spec, `docs/runbook-ship.md` the deploy/domain/analytics procedures.
- `.github/workflows/` — `deploy.yml` (push to `main` → GitHub Pages) and
  `nightly-refresh.yml` (01:00 UTC fetch; commits and deploys only on a diff,
  gated on the suite).

## Toolchain

pnpm (version pinned by `packageManager`), Node ≥ 24. Vite for the build,
Vitest + happy-dom for tests, Biome for lint and format. Scripts live in
`package.json`; note that typechecking is split in two — `pnpm typecheck` for the
app and `pnpm typecheck:worker` for the service worker.

`.githooks/pre-commit` runs lint-fix, both typechecks, and the suite. Enable it
once per clone: `git config core.hooksPath .githooks`. Don't bypass it — CI runs
the same checks and fails the deploy instead.

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. External PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Git practices

Commit subjects are a gitmoji plus a short imperative phrase (`✨ add the stage
filter`) — no `type(scope):`, and **no `Co-Authored-By:` trailers**. Never
force-push `main` (it deploys and takes nightly bot commits). See
`docs/agents/git-practices.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
