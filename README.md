# Linked Lovelace UI by [@daredoes](https://www.github.com/daredoes)

Reusable card templates for Home Assistant dashboards. Mark any card with `ll_key` and it becomes a template you can place on every user-created dashboard (so everything except Overview), then sync them all with one click. It runs entirely in your browser as a client-side script, with no backend integration to configure.

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-blue.svg)](https://github.com/hacs/integration)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

## Try It Without Installing

The [Live Demo](https://daredoes.work/linked-lovelace-ui/demo) runs the real template engine in your browser inside a simulated Home Assistant dashboard. Click **Load Data**, then **Update All**, then edit the `room` template and sync again to watch one change reach every card that uses it.

Already have Home Assistant? Add a `custom:linked-lovelace-starter` card and click **Create Demo Dashboard**. It builds the same showcase as a brand-new dashboard in your config and never touches your existing ones. The [Starter Dashboard](https://daredoes.work/linked-lovelace-ui/starter-dashboard) page walks through it.

![Linked Lovelace V2 Demo](/docs_site/images/llv2.gif)

## What It Does

- Turn any card into a template by adding `ll_key: my_template` to its config, then use it anywhere with `ll_template: my_template`.
- Pass variables through `ll_context` and read them in the template as `<%= context.name %>`.
- Templating is [Eta JS](https://eta.js.org/), so if/else, loops, and partials all work. Partials can be defined inline or fetched from a URL.
- Sync from the status card: **Load Data** reads your dashboards, **Update All** writes the rendered results back.

## Installation

Install through HACS: it's in the default store, listed under frontend as `Linked Lovelace`. If you don't use HACS, download `linked-lovelace-ui.js` from the [latest release](https://github.com/daredoes/linked-lovelace-ui/releases/latest) and register it as a dashboard resource. Full steps are in [Getting Started](https://daredoes.work/linked-lovelace-ui/getting-started).

> [!WARNING]
> `Linked Lovelace` runs commands on behalf of the user's browser to modify dashboard configurations, not on behalf of the Home Assistant system. A user's access may modify the outcome of the program.
>
> __Always back-up your configs if you feel unsure about what you are about to do!__

## Documentation

The [documentation site](https://daredoes.work/linked-lovelace-ui/) has the full guides and reference:

- [Getting Started](https://daredoes.work/linked-lovelace-ui/getting-started) covers installation and confirming the card loaded.
- [Create Your First Template](https://daredoes.work/linked-lovelace-ui/create-your-first-template) builds a template from scratch.
- [Template Syntax](https://daredoes.work/linked-lovelace-ui/template-syntax) and [Providing Template Context](https://daredoes.work/linked-lovelace-ui/providing-template-context) cover Eta JS and `ll_context`.
- [Creating Partials](https://daredoes.work/linked-lovelace-ui/creating-partials) shows reusable snippets, including ones loaded from a URL.
- [Using the Status Card](https://daredoes.work/linked-lovelace-ui/using-the-status-card) explains **Load Data**, **Update All**, and per-dashboard updates.
- [API Reference](https://daredoes.work/linked-lovelace-ui/api-reference) lists every `ll_*` key and card option.
- [Advanced Features](https://daredoes.work/linked-lovelace-ui/advanced-features) covers `ll_keys`, priorities, and nesting.
- [Troubleshooting](https://daredoes.work/linked-lovelace-ui/troubleshooting) is for when a sync doesn't do what you expected.

## Upgrading From V1

Template dashboards are gone: any top-level card with an `ll_key` is a template now. `template_data` (or `ll_data`) became `ll_context`, and `template` became `ll_template`. To convert an old `$example$` variable, swap the first `$` for `<%=` and the second for `%>`, then read it from context: `<%= context.example %>`. The [migration guide](https://daredoes.work/linked-lovelace-ui/advanced-features#migration-from-v1) has the details, and if I forgot something, file an issue.

## Support

Hey you! Help me out for a couple of :beers: or a :coffee:!

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://www.buymeacoffee.com/daredoes)

Found a bug or got stuck? [File an issue](https://github.com/daredoes/linked-lovelace-ui/issues) or [join the Discord](https://discord.gg/WbsNtASKau) to chat with me directly.

## Development

The project builds with [bun](https://bun.sh/) and rollup: `bun install`, then `bun run build` (or `bun run start` for a watch build). `bun run test` runs the Jest suite.

The `eta` dependency installs from a vendored tarball (`eta-3.0.3.tgz`) instead of the npm registry. The published package pulls in Node-only modules (`node:path`, `node:fs`) for server-side features this card never uses, and they break the browser bundle. The tarball is the same 3.0.3 release with those imports stripped. If you upgrade eta, rebuild the tarball the same way or confirm upstream no longer needs the patch.

---

[commits-shield]: https://img.shields.io/github/commit-activity/y/daredoes/linked-lovelace-ui.svg
[commits]: https://github.com/daredoes/linked-lovelace-ui/commits/master
[license-shield]: https://img.shields.io/github/license/daredoes/linked-lovelace-ui.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2026
[releases-shield]: https://img.shields.io/github/release/daredoes/linked-lovelace-ui.svg
[releases]: https://github.com/daredoes/linked-lovelace-ui/releases
