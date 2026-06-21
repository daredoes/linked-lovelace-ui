---
name: card-build
description: Build, watch, serve, and unit-test the Linked Lovelace card bundle. Use when asked to build the card, run rollup, set up a live dev loop against Home Assistant, run Jest unit tests, or understand the dist/serve pipeline.
---

# Linked Lovelace — Build & Dev Loop

A client-side Home Assistant Lovelace card. Rollup bundles
`src/linked-lovelace-ui.ts` into a single ESM file
`dist/linked-lovelace-ui.js` that HA loads as a Lovelace resource.

## Commands

```bash
yarn install        # deps (yarn 1.x; .nvmrc pins node v16 but v22 builds fine)
yarn build          # rollup -c  -> dist/linked-lovelace-ui.js (minified)
yarn start          # rollup -c --watch + serve on http://0.0.0.0:5000
yarn test           # jest (102 unit tests; engine + controllers)
```

`prebuild`/`prestart` run `make-version` which writes `src/version.ts` from
`package.json` version — don't hand-edit `src/version.ts`.

## Serving into a live Home Assistant

Two options:

1. **rollup serve** (`yarn start`) exposes the bundle on `:5000`. Reference it
   from a dashboard resource: `url: http://127.0.0.1:5000/linked-lovelace-ui.js`,
   `type: module`. The browser (not HA) fetches it, so the host port is what
   matters. CORS headers are already set in `rollup.config.js`.
2. **HA `/local/`** (used by the e2e demo): copy `dist/linked-lovelace-ui.js`
   into HA's `config/www/` and reference `url: /local/linked-lovelace-ui.js`.
   No CORS, no extra server. See the `e2e-demo` skill.

## Devcontainer

`.devcontainer/` uses `ludeeus/container:monster` (HA + node). `postCreateCommand`
is `yarn`. Note `.devcontainer/ui-lovelace.yaml` references the **stale** type
`custom:linked-lovelace-ui` — the real cards are `linked-lovelace-status` /
`-template` / `-partials` (see `e2e-demo` skill).

## Source map

- `src/linked-lovelace-ui.ts` — entry; imports + registers the cards.
- `src/linked-lovelace-status.ts` — overview/control card (Load Data, Update All).
- `src/linked-lovelace-template.ts` / `-partials.ts` — template/partial cards.
- `src/controllers/hass.ts` — `HassController`: refresh/discover/update against HA.
- `src/linked-lovelace-api.ts` — thin `hass.callWS` wrapper (lovelace/* APIs).
- `src/v2/` — `LinkedLovelaceController` + Eta `TemplateEngine` (the unit-tested core).

## Verifying a change end-to-end

`yarn test` covers the engine. To confirm rendering + live HA wiring, use the
`e2e-demo` skill (`./scripts/e2e.sh`) — it rebuilds and runs Playwright against
a real HA.
