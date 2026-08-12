# Runbook: ship the site

Live: <https://oyablikk.no/> (github.io origin 301-redirects here)

Deploys are automatic: push to `main` runs `.github/workflows/deploy.yml`
(ADR-0009). Nightly refresh (`nightly-refresh.yml`, 01:00 UTC) re-fetches the
programme and calls the deploy workflow only when `schedule.json` changed
(ADR-0020). Nothing below is needed for a routine change — only for the
one-off launch steps.

The repo is **public**. Nothing in the pipeline depends on visibility either
way — GitHub Pages serves the built site from a private repo just as happily,
should it ever go back.

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

## How the domain is wired today

Cloudflare is the authoritative nameserver for `oyablikk.no` (`julio` and
`veronica.ns.cloudflare.com`) and **proxies** both the apex and `www` — they
resolve to Cloudflare anycast addresses, not to GitHub's. GitHub Pages is the
origin behind that proxy and still holds `oyablikk.no` as its custom domain, so
`prudentmildew.github.io/oyablikk/` 301-redirects to the apex.

Two consequences worth keeping in mind:

- **The proxy is load-bearing for analytics.** The beacon is injected at the
  edge (ADR-0016), so grey-clouding a record — or moving DNS off Cloudflare —
  silently ends analytics with no change to this repo. Nothing in the app will
  tell you; the numbers simply stop.
- **The origin is invisible from outside.** `dig` shows Cloudflare's addresses
  whatever sits behind them, so the DNS records themselves can only be
  confirmed in the Cloudflare dashboard, never from a terminal.

Keep SSL/TLS mode at **Full (strict)** — Pages presents a valid certificate for
the custom domain, so there is no reason to accept anything weaker.

## Custom domain cut-over (ADR-0015) — done

Already run for `oyablikk.no`. Kept here as the procedure for any future origin
change. The build is origin-agnostic apart from the two absolute OG tags in
`index.html`. Do not add a `CNAME` file; Actions-based deploys ignore it.

1. Pick and register the domain (PRD §10.1). Record the choice in ADR-0015 and
   flip its status `proposed` → `accepted`. If staying on github.io, record
   that instead and close the ADR.
2. Point DNS at Pages. **Behind Cloudflare** (the current arrangement, and the
   one that keeps analytics working), add proxied records at the apex and
   `www` targeting `prudentmildew.github.io`; Cloudflare flattens the apex
   `CNAME` automatically. **Without a proxy**, use GitHub's own records
   instead:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` `www` → `prudentmildew.github.io` (GitHub redirects www → apex)
3. Repo Settings → Pages → Custom domain → enter the apex → Save. Wait for
   the DNS check to pass. Cloudflare's proxy can stall that check; set the
   records to DNS-only until it passes, then re-enable the proxy.
4. Tick **Enforce HTTPS**. May be greyed out up to 24 h while the certificate
   provisions.
5. Verify:

```sh
dig +short <domain> A                                          # Cloudflare IPs while proxied
curl -sI https://<domain>/ | head -1
curl -sI https://prudentmildew.github.io/oyablikk/ | head -1   # expect 301
```

6. Reinstall the PWA — installs from the github.io subpath are orphaned by the
   origin change (ADR-0009/0015, accepted).

## Analytics (ADR-0016)

Cloudflare Web Analytics, no cookies, one third-party request.

Set up **automatically**, at the edge: because the site is proxied, Cloudflare
injects the beacon into HTML responses itself. There is no token in the repo
and no snippet in `index.html` — deliberately, and `index.html` says so.

1. Cloudflare dashboard → Web Analytics → the site's hostname, with automatic
   setup enabled. The token is per-site, so a domain change means a new one.
2. Verify in DevTools → Network on the live site: exactly one request to
   `static.cloudflareinsights.com`, and no cookies set.
3. Confirm the About screen's privacy copy names exactly that one request.

**Checking from the terminal:** Cloudflare injects only when the request asks
for HTML, so a bare `curl` — which sends `Accept: */*` — comes back with no
beacon and looks alarmingly like analytics being off. Send the header:

```sh
curl -s -H 'Accept: text/html' https://oyablikk.no/ | grep -c cloudflareinsights   # expect 1
```

The `Accept` header is the whole trigger; the User-Agent makes no difference
(tested both ways). Don't conclude analytics is broken from a request that
never asked for HTML in the first place.
