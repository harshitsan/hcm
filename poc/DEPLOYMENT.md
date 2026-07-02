# Deployment — Cloudflare Workers

This app is a static Vite SPA hosted on **Cloudflare Workers (Static Assets)** across three
environments. Each environment is a separate Worker, built from its own Vite mode / `.env` file.

| Environment | Branch    | Vite mode / env file | Worker name                       | Default URL                                              |
| ----------- | --------- | -------------------- | --------------------------------- | -------------------------------------------------------- |
| dev         | `develop` | `.env.development`   | `mls-apartment-frontend-dev`      | `https://mls-apartment-frontend-dev.<account>.workers.dev`        |
| staging     | `staging` | `.env.staging`       | `mls-apartment-frontend-staging`  | `https://mls-apartment-frontend-staging.<account>.workers.dev`    |
| production  | `main`    | `.env.production`    | `mls-apartment-frontend-production` | `https://mls-apartment-frontend-production.<account>.workers.dev` |

> `VITE_*` variables are baked into the client bundle at build time, so each environment is built
> separately with its matching `.env.<mode>` file before deploy. Never put secrets in these files.

## One-time setup

### 1. GitHub Actions secrets

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with the **Workers Scripts: Edit** permission
  (create at https://dash.cloudflare.com/profile/api-tokens, "Edit Cloudflare Workers" template).
- `CLOUDFLARE_ACCOUNT_ID` — your account ID (Cloudflare dashboard → Workers & Pages → right sidebar,
  or run `npx wrangler whoami`).

### 2. Branches

The `develop` and `main` branches already exist. Create the `staging` branch so its workflow can run:

```bash
git checkout main && git pull
git checkout -b staging && git push -u origin staging
```

## How CI/CD works

`.github/workflows/deploy.yml` runs on every push to `develop`, `staging`, or `main`:

1. Resolves the target environment from the branch.
2. `npm ci`
3. `npm run build:<env>` (Vite build in the matching mode)
4. `wrangler deploy --env <env>` via `cloudflare/wrangler-action`

You can also trigger any environment manually from the **Actions** tab
(**Deploy to Cloudflare Workers → Run workflow → choose environment**).

## Deploy from your machine

Requires `npx wrangler login` (or `CLOUDFLARE_API_TOKEN` exported) once.

```bash
npm run deploy:dev          # build (dev mode) + deploy to dev worker
npm run deploy:staging      # build (staging mode) + deploy to staging worker
npm run deploy:production   # build (production mode) + deploy to production worker
```

## Local Workers preview

```bash
npm run dev        # normal Vite dev server (fast, HMR)
npm run build:dev  # produce ./dist
npm run cf:dev     # serve ./dist through the Workers runtime locally (wrangler dev --env dev)
```
