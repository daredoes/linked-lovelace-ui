---
name: e2e-demo
description: Run, debug, or extend the Linked Lovelace end-to-end demo — a real Home Assistant (Docker) serving the built card, driven by Playwright. Use when asked to run the demo environment, run/add e2e tests, reproduce card behavior in a real browser, or debug HA auth/onboarding for tests.
---

# Linked Lovelace E2E Demo

Runs the **built card inside a real Home Assistant** and drives it with
Playwright. Validates what the Jest unit tests mock: the live Lovelace websocket
API, custom-element registration, and Lit rendering. Full design: `docs/E2E.md`.

## Run

```bash
./scripts/e2e.sh                 # build -> HA up -> wait -> test -> down
KEEP_UP=1 ./scripts/e2e.sh       # leave HA running for iteration
cd e2e && npx playwright test    # against already-running HA
cd e2e && npx playwright test --ui   # interactive debugging
./scripts/screenshots.sh         # capture doc screenshots -> docs/imgs/e2e/
```

CI runs the suite on PRs to `master` via `.github/workflows/e2e.yml` (calls
`./scripts/e2e.sh`). The screenshot capture uses a **separate** config
(`e2e/playwright.screenshots.config.ts`, testDir `e2e/screenshots/`) so docs
artifacts are never coupled to the CI gate.

First run pulls `ghcr.io/home-assistant/home-assistant:2024.12` and installs
Chromium for Playwright. Requires Docker + yarn + Node.

## How it fits together

- `e2e/docker-compose.yml` — HA on :8123, mounts `e2e/ha-config` as `/config`.
- The freshly built `dist/linked-lovelace-ui.js` is copied to
  `e2e/ha-config/www/` and served by HA at `/local/linked-lovelace-ui.js`
  (referenced from `ui-lovelace.yaml`). This avoids CORS + a separate server.
- `e2e/global-setup.ts` onboards/logs in over REST and writes
  `e2e/storage-state.json` so specs start authenticated.
- `e2e/tests/linked-lovelace.spec.ts` — the checks.

## The real cards (NOT `linked-lovelace-ui`)

Registered custom elements are:
- `linked-lovelace-status` — overview/control card. Header "Linked Lovelace
  Status". Shows "Load Data" → after loading, tabs (Dashboards/Templates/
  Partials/Logs) + "Refresh"/"Update All". `Load Data` drives the live websocket
  lovelace API to discover templates (`ll_key`) and partials.
- `linked-lovelace-template` — renders a static migration notice; real
  templating happens via the status card's `Update All`.
- `linked-lovelace-partials` — registers Eta partials.

`custom:linked-lovelace-ui` (used in `.devcontainer/ui-lovelace.yaml`) is a
**stale type with no matching element** — don't use it in demos; use
`custom:linked-lovelace-status`.

## Gotchas (learned the hard way)

- **`hassTokens` must include `hassUrl`**, else the HA frontend crashes on
  bootstrap (`undefined ... 'substr'`). See `writeStorageState` in global-setup.
- **Single-file Docker bind mounts fail on macOS virtiofs.** Mount the whole
  `ha-config` dir and copy the bundle into `ha-config/www` instead.
- **Wait for HA fully booted** before tests — root returns 200/302 only once
  the frontend is served; the script polls for this.
- HA frontend uses **open shadow DOM**; Playwright locators pierce it, but for
  state assertions it's most robust to `card.evaluate(el => el._loaded)` against
  the `linked-lovelace-status` element directly.
- In **yaml lovelace mode**, `lovelace/dashboards/list` returns only storage
  dashboards; the API prepends a synthetic "Overview" (`url_path: ''`) so the
  default yaml dashboard is still read via `lovelace/config` with `url_path: null`.

## Test layout

- `e2e/tests/linked-lovelace.spec.ts` — core checks against the yaml demo
  dashboard (registration, render, live discovery).
- `e2e/tests/features.spec.ts` — 8 feature checks (add controller card,
  add/use/modify+sync templates, context variables, create/use partials, nested
  templates) against **writable storage dashboards**.
- `e2e/tests/helpers.ts` — `createDashboard`/`saveConfig`/`readConfig`/
  `deleteDashboard` (Lovelace websocket via `hass.callWS` in the browser) and
  `openStatusCard`/`loadData`/`updateAll`.

## Key facts for writing feature tests

- **Sync (`Update All`) only works on storage dashboards.** Create them at
  runtime with `lovelace/dashboards/create` + `lovelace/config/save`; the yaml
  demo dashboard is read-only.
- The card bundle is loaded for ALL dashboards via `frontend.extra_module_url`
  in `configuration.yaml` (NOT a lovelace `resources:` entry — that only covers
  the yaml dashboard, and a second load would double-`define` the elements).
- Template syntax: `<%= context.x %>` for variables (filled from `ll_context`);
  partials are `custom:linked-lovelace-partials` `partials:[{key,template}]` used
  as `<%~ include('key', {...context}) %>`; nested templates = an `ll_key`
  template whose child is a `linked-lovelace-template` referencing another
  template (order them with `ll_priority`, lowest first).
- `Update All` triggers a `confirm()` — accept it: `page.on('dialog', d => d.accept())`.
- After sync, assert by reading the saved config back (`lovelace/config`); a
  rendered usage keeps its `ll_template`/`ll_context` plus the template's fields.
- Keep demo dashboards network-free (no external partial URLs) for reliability.
