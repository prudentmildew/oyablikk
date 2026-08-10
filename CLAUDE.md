# CLAUDE.md

## The project

Øyablikk — a mobile web app for the Øya Festivalen 2026 park programme. Vanilla
TypeScript + Vite, no UI framework; the app is a single screen of swipeable day
panes. Deployed to <https://oyablikk.no> via GitHub Pages. Read `CONTEXT.md` for
the domain vocabulary before touching feature code.

Shape of the repo:

- `src/` — the app (DOM built imperatively, `styles.css`, service worker `sw.ts`),
  with `*.test.ts` files sitting beside what they test.
- `scripts/` — the data pipeline: `fetch-schedule.ts` (thin IO shell) around the
  pure `to-schedule.ts`, plus `edition-config.ts`, the one file that changes
  between festival editions.
- `data/schedule.json` — the committed, generated app input. Never hand-edit it;
  re-run the fetch.
- `docs/adr/` — architecture decisions, indexed in `docs/adr/README.md`. Code
  comments reference them by number; keep doing that.

## Toolchain

pnpm (version pinned by `packageManager`), Node ≥ 24.

| Command | Does |
|---|---|
| `pnpm dev` | Vite dev server |
| `pnpm test` | Vitest (happy-dom), one shot |
| `pnpm lint` / `pnpm lint:fix` | Biome check / write |
| `pnpm typecheck` + `pnpm typecheck:worker` | app and service-worker tsconfigs |
| `pnpm build` | both typechecks, then `vite build` |
| `pnpm fetch-schedule` | re-fetch the programme from Sanity into `data/schedule.json` |

`.githooks/pre-commit` runs lint-fix, both typechecks, and the suite. Enable it
once per clone: `git config core.hooksPath .githooks`.

CI: `deploy.yml` (lint → test → build → Pages, on push to `main`) and
`nightly-refresh.yml` (fetch at 03:00 Oslo, `git diff --quiet` gate, suite
before the bot commit, then deploy via `workflow_call`).

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. External PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
