# Runbook: ship the site

Live: <https://oyablikk.no/> (github.io origin 301-redirects here)

Deploys are automatic: push to `main` runs `.github/workflows/deploy.yml`
(ADR-0009). Nightly refresh (`nightly-refresh.yml`, 01:00 UTC) re-fetches the
programme and calls the deploy workflow only when `schedule.json` changed
(ADR-0020). Nothing below is needed for a routine change — only for the
one-off launch steps.

The repo stays **private**. GitHub Pages serves the built site publicly from a
private repo; only the source is hidden. Nothing in the pipeline requires a
public repo.

## Deploy by hand

```sh
gh workflow run deploy.yml            # rebuild + publish current main
gh run watch                          # follow it
```

## Force a data refresh

```sh
gh workflow run nightly-refresh.yml   # fetch; commits + deploys only on diff
```

Locally, to see what a refresh would change:

```sh
node scripts/fetch-schedule.ts && git diff --stat
```

## Check the nightly is green

```sh
gh run list --workflow nightly-refresh.yml --limit 10
```

Want both outcomes represented before the festival: no-change nights (run
green, no commit) and at least one real-change night (bot commit + Deploy run
right after).

## Custom domain cut-over (ADR-0015) — done

Already run for `oyablikk.no`. Kept here as the procedure for any future
origin change. The build is origin-agnostic apart from the two absolute OG
tags in `index.html`. Do not add a `CNAME` file; Actions-based deploys ignore
it.

1. Pick and register the domain (PRD §10.1). Record the choice in ADR-0015 and
   flip its status `proposed` → `accepted`. If staying on github.io, record
   that instead and close the ADR.
2. At the DNS host, at the **apex**, add GitHub Pages' records:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` `www` → `prudentmildew.github.io` (GitHub redirects www → apex)
3. Repo Settings → Pages → Custom domain → enter the apex → Save. Wait for
   the DNS check to pass.
4. Tick **Enforce HTTPS**. May be greyed out up to 24 h while the certificate
   provisions.
5. Verify:

```sh
dig +short <domain> A
curl -sI https://<domain>/ | head -1
curl -sI https://prudentmildew.github.io/oyablikk/ | head -1   # expect 301
```

6. Reinstall the PWA — installs from the github.io subpath are orphaned by the
   origin change (ADR-0009/0015, accepted).

## Analytics (ADR-0016)

Cloudflare Web Analytics, no cookies, one third-party request.

1. Cloudflare dashboard → Web Analytics → Add a site → hostname = the final
   origin (use the github.io host until the domain resolves; the token is
   per-site, so a domain change means a new token).
2. Paste the beacon token into the app and deploy.
3. Verify in DevTools → Network on the live site: exactly one request to
   `static.cloudflareinsights.com`, and no cookies set.
4. Confirm the About screen's privacy copy names exactly that one request.
