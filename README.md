# Anthony Ecom — Storefront + Admin Client

React + Vite + TypeScript frontend for the white-label e-commerce template:
a customer-facing storefront (browsing, cart, checkout, account) and an admin
panel (products, orders, theme editor), built with shadcn/ui and Tailwind
(CSS-variable-driven theming — see `src/theme/`).

This is a standalone repo. It is paired with a separate backend repo (the
Express/Knex/MySQL API), which is developed and deployed independently. This
client never talks to the backend by absolute URL — all API calls go through
`src/api/client.ts` using same-origin relative paths (`/api/*`):

- **Dev**: Vite's dev-server proxy (`vite.config.ts`) forwards `/api/*` to
  the backend, currently hardcoded to `http://localhost:4002`. Update that
  file if the backend repo runs on a different host/port locally.
- **Production**: Caddy (config lives in the backend repo) reverse-proxies
  `/api/*` to the Express process and serves this client's static build
  (`dist/`) for everything else, with SPA fallback to `index.html`.

For full technical detail (API contracts, DB schema, theming algorithm,
security notes) see [`docs/architecture.md`](./docs/architecture.md).

## Prerequisites

- Node.js 18+ and npm 9+.
- The separate backend repo running locally (default `http://localhost:4002`)
  for any API-backed feature to work in dev.

## Setup

```bash
npm install
```

No `.env` is required to run this app today — see `.env.example` for why,
and where to add a real env var if one becomes necessary later.

## Running the dev server

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:5173`, proxying `/api/*` to
the backend repo.

## Building for production

```bash
npm run build
```

Outputs a static build to `dist/`, which the backend repo's Caddy config
expects to serve (see that repo's `Caddyfile` and README for the assumed
directory layout).

## Running tests

```bash
npm test
```

Runs vitest (currently covers theme mode resolution — see
`src/theme/__tests__/`).

## Linting

```bash
npm run lint
```

Runs oxlint (see `.oxlintrc.json`). If you enable type-aware rules,
`oxlint-tsgolint` and edits to `.oxlintrc.json` are needed — see comments in
that file.

## Environment variables

None are currently required (see `.env.example`). If a real one is added in
the future (e.g. a configurable API base URL for non-relative deployments),
document it in the table below and in `.env.example`.

| Variable | Purpose |
|---|---|
| _(none yet)_ | |
