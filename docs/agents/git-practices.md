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

A subject is **one gitmoji, a space, then a short imperative phrase**. No
`type(scope):` prefix — the emoji carries the category, and the whole history
reads this way:

```
✨ mark today's pane with Day standing (#19)
🐛 point the Open Graph tags at oyablikk.no
📝 add a human README and realign the agent docs
```

Keep it concise: aim for a subject under ~60 characters, lowercase after the
emoji, no full stop. Put the reasoning in the body, not the subject — bodies
are welcome and encouraged for anything non-obvious. Reference the GitHub issue
in the subject or body when one exists (see `issue-tracker.md`).

**No `Co-Authored-By:` trailers.** They were stripped from the entire history
on 2026-08-12 and should not come back — not for agent-written commits, not for
anything. Don't add other trailers either unless asked.

The vocabulary in use, which is the [gitmoji](https://gitmoji.dev) set:

| Emoji | For |
|---|---|
| ✨ | a new feature |
| 🐛 | a bug fix |
| 📝 | documentation |
| ✅ | tests |
| 👷 | CI and workflows |
| 🔧 | config files, tooling |
| ♻️ | refactoring, no behaviour change |
| 🎨 | structure and formatting |
| 💄 | visual and styling work |
| ⬆️ | dependency bumps |
| 🔥 | removing code or files |
| 🗃️ | the nightly data refresh |
| 🔀 | merges |
| 🎉 | the initial commit |

Reach outside the table when something genuinely fits better — gitmoji is a
large set and this is the common core, not a closed list.

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

This has happened once: on **2026-08-12** every commit message was rewritten to
the gitmoji format and stripped of `Co-Authored-By:` trailers. Trees were
untouched — only messages changed — but **every SHA before that date changed**,
so old hashes in issues, PR comments or notes no longer resolve. Match on the
subject instead.

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
git log --format='%ae' | sort -u                        # you + github-actions[bot], nobody else
git log --format='%s' | grep -nE '^[[:alnum:]]'         # subjects not starting with a gitmoji
git log --format='%B' | grep -icE '^ *co-authored-by *:'   # expect 0
```

The second command should print nothing: every subject in the history leads
with an emoji, so anything starting with a letter or digit is a subject that
broke the format. No range is needed — the whole history was converted on
2026-08-12, so the rule applies from the root commit onward.

The third counts leftover `Co-Authored-By:` trailers and must read `0`. It
matches the line only at the start of a line, so it won't trip over the one
commit body that discusses the trailer in prose.
