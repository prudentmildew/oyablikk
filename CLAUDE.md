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

pnpm (version pinned by `packageManager`), Node ≥ 24. Scripts live in
`package.json`; note that typechecking is split in two — `pnpm typecheck` for the
app and `pnpm typecheck:worker` for the service worker.

`.githooks/pre-commit` runs lint-fix, both typechecks, and the suite. Enable it
once per clone: `git config core.hooksPath .githooks`.

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. External PRs are **not** a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Git practices

Conventional Commits, `Co-Authored-By:` expected from agents, never force-push
`main` (it deploys and takes nightly bot commits). See `docs/agents/git-practices.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
