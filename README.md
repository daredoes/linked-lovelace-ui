# Linked Lovelace UI by [@daredoes](https://www.github.com/daredoes)

A pure JS client-side implementation of re-usable cards between Home Assistant Dashboards (excluding Overview).

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
[![hacs_badge](https://img.shields.io/badge/HACS-Default-blue.svg)](https://github.com/hacs/integration)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

## Support

Hey you! Help me out for a couple of :beers: or a :coffee:!

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://www.buymeacoffee.com/daredoes)

---

## Features

* Create cards in the Lovelace UI that can be **linked** to multiple dashboards
* Provide templating when creating linked cards using [https://eta.js.org/](EtaJS)
  * Create dynamic partials from local templates, or online templates!
  * Access Template Data with variable `context` e.g. `<%= context.name %>`

---

## Installation

Add through [HACS](https://github.com/custom-components/hacs)

---

## Options

| Name              | Type    | Requirement  | Description                                 | Default             |
| ----------------- | ------- | ------------ | ------------------------------------------- | ------------------- |
| type              | string  | **Required** | `custom:linked-lovelace-template`                   |
| name              | string  | **Optional** | Card name                                   | ``       |

## Templates

---

Note to self: Drop the need to have a template dashboard, allow any card to provide top level details about itself that gets stripped from children
ll_key: slider
ll_priority: 0


[commits-shield]: https://img.shields.io/github/commit-activity/y/daredoes/linked-lovelace-ui.svg
[commits]: https://github.com/daredoes/linked-lovelace-ui/commits/master
[license-shield]: https://img.shields.io/github/license/daredoes/linked-lovelace-ui.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2023
[releases-shield]: https://img.shields.io/github/release/daredoes/linked-lovelace-ui.svg
[releases]: https://github.com/daredoes/linked-lovelace-ui/releases
