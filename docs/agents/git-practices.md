# Git Practices

Conventions for **every commit** made in this repo, by any contributor or agent.

## Identity

This is a personal project, so the personal identity is the correct one — no
repo-local override needed. If you have a work identity set globally on your
machine, pin the personal one here instead of committing under it:

```sh
git config --local user.name  "Your Name"
git config --local user.email "you@example.com"
```

The one other author in the history is `github-actions[bot]`, which commits the
nightly `data/schedule.json` refresh. Leave those commits alone.

## Commit messages

- **Conventional Commits**, matching the existing history: `feat:`, `fix:`,
  `test:`, `ci:`, `chore:`, `docs:`, `style:`, with an optional scope —
  `chore(data):`, `feat(favourites):`, `fix(og):`. Keep the subject short and in
  the imperative.
- **`Co-Authored-By:` is expected** when an agent wrote the commit. Attribute
  honestly; don't strip the trailer.
- Reference the GitHub issue in the subject or body when one exists — see
  `issue-tracker.md`.

## Signing — optional here

Commits in this repo are **not signed**, and nothing enforces signing. The
nightly bot commits can't be SSH-signed anyway, so a blanket "must show
Verified" rule would be unenforceable across the history.

If you want to sign your own commits, set it up repo-locally:

```sh
git config --local gpg.format ssh
git config --local user.signingkey ~/.ssh/<your-key>.pub
git config --local commit.gpgsign true
git config --local tag.gpgsign true
```

For GitHub to render the **Verified** badge, the **public** key must be
registered as a **Signing key**, not just an auth key:

- Web: Settings → SSH and GPG keys → New SSH key → Key type: **Signing Key**.
- CLI: `gh ssh-key add ~/.ssh/<your-key>.pub --type signing`
  (needs the `admin:ssh_signing_key` scope — grant once with
  `gh auth refresh -h github.com -s admin:ssh_signing_key`).

## History rewrites

`main` is the deploy branch: every push runs `deploy.yml` and publishes to
<https://oyablikk.no>, and the nightly workflow commits to it unattended. Never
rewrite published history or force-push `main` without explicit confirmation —
a rewrite mid-nightly loses the schedule refresh. When authorized, use
`--force-with-lease`.

Feature branches are yours to rebase freely before they merge.

## Pre-commit hook

`.githooks/pre-commit` runs lint-fix, both typechecks, and the test suite.
Enable it once per clone:

```sh
git config core.hooksPath .githooks
```

Don't bypass it with `--no-verify`; CI runs the same checks and will fail the
deploy instead.

## Verifying

```sh
git log --format='%ae' | sort -u    # you + github-actions[bot], nobody else
git log --format='%s' 4e8e66c..HEAD | grep -vE '^(feat|fix|test|ci|chore|docs|style|refactor|perf)(\(.+\))?: |^Merge '
```

The second command should print nothing — any output is a subject that broke the
Conventional Commits format. The range starts at `4e8e66c` on purpose: every
commit up to and including it predates the convention and uses a bare imperative
subject ("Port the app shell: …"). Don't rewrite those to match.
