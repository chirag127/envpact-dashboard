# envpact-dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://github.com/chirag127/envpact-dashboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/chirag127/envpact-dashboard/actions/workflows/deploy.yml)

Web dashboard for **envpact** — manage your private secrets vault
visually via GitHub OAuth.

> Live at **[envpact.oriz.in](https://envpact.oriz.in)** (and
> mirrored at [envpact-dashboard.pages.dev](https://envpact-dashboard.pages.dev)).

Part of the [envpact](https://github.com/chirag127/envpact)
ecosystem.

## Privacy & Security

This is a **100% client-side static site**. There is no envpact
server, no third-party storage, no telemetry.

- Authentication uses GitHub's [OAuth Device Flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow) — no backend redirect, no client secret.
- Your access token lives **only** in this tab's `sessionStorage`
  (cleared the moment the tab closes). It is never persisted to
  `localStorage`, never sent anywhere except `api.github.com`.
- Every read & write goes directly from your browser to
  `https://api.github.com/repos/<you>/envpact-secrets/contents/secrets.json`.
- The dashboard origin is fully static — hosted on Cloudflare Pages
  with strict CSP and no inline scripts beyond the build output.

## Features

- **Sign in with GitHub** (device flow — works without a backend).
- **View your vault**: projects, key counts, environment list.
- **List shared secrets**: names + encryption status (values
  never appear).
- **Download `.env`** for any project + environment.
- **Direct link to GitHub commit history** for full audit log.

## Setup (for users)

You need an envpact vault first:

```bash
npx envpact-cli --init auto
# Creates {your-username}/envpact-secrets (private) and clones it.
```

Then visit **https://envpact.oriz.in**, click "Connect GitHub",
authorize, and you're in.

## Setup (for hosting your own)

1. Fork this repo.
2. Create a GitHub OAuth App at
   [github.com/settings/developers](https://github.com/settings/developers):
   - Application name: `envpact-dashboard` (or your choice).
   - Homepage URL: `https://your-domain.example`.
   - Authorization callback URL: `https://your-domain.example`
     (unused for device flow but required by the form).
   - **Enable Device Flow** under the OAuth app settings.
3. Set the GitHub OAuth client_id as a Cloudflare Pages env var:
   - `PUBLIC_GITHUB_OAUTH_CLIENT_ID = <your-client-id>`.
4. Connect the repo to Cloudflare Pages, build command
   `npm run build`, output `dist/`. Done.

The `deploy.yml` GitHub Action also automates this — set
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets.

## Deploying to your custom domain

In Cloudflare Pages → Custom domains → add `envpact.oriz.in` (or
whatever you own). DNS gets validated automatically if the domain
is on Cloudflare.

## License

MIT © Chirag Singhal — see [LICENSE](./LICENSE).
