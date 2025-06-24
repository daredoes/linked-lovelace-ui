# Linked Lovelace UI by [@daredoes](https://www.github.com/daredoes)

A pure JS client-side implementation of re-usable cards between Home Assistant Dashboards (excluding Overview).

[In-Progress Documentation Site](https://daredoes.github.io/linked-lovelace-ui/)

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

| Name              | Type    | Requirement  | Description                                                | Default             |
| ----------------- | ------- | ------------ | ---------------------------------------------------------- | ------------------- |
| type              | string  | **Required** | While normally required, this will be replaced             |                     |
| ll_template       | string  | **Optional** | ll_key name                                                | ``                  |
| ll_context        | object  | **Optional** | An object that can be accessed inside of EtaJS as `context`| ``                  |
| ll_template_engine| string  | **Optional** | Template processor ('etajs', 'jinja2')                     | 'etajs'             |
| ll_card_config    | string  | **Optional** | Template returning a JSON object, merged to linked card    | ``                  |

| Name              | Type    | Requirement  | Description                                                                                               | Default             |
| ----------------- | ------- | ------------ | --------------------------------------------------------------------------------------------------------- | ------------------- |
| type              | string  | **Required** | A normal Lovelace card type                                                                               |                     |
| ll_key            | string  | **Required** | The name you want to use for this template                                                                | ``                  |
| ll_priority       | number  | **Optional** | Used in sorting the order that templates are added to the system for nesting. Lowest number comes first.  | `0`                 |

| Name              | Type    | Requirement  | Description                                                                                               | Default             |
| ----------------- | ------- | ------------ | --------------------------------------------------------------------------------------------------------- | ------------------- |
| type              | string  | **Required** | `custom:linked-lovelace-partials`                                                                         |                     |
| partials          | list    | **Optional** | A list of partials you want to use in Eta JS                                                              | ``                  |

A `partial` object has the following shape
| Name              | Type    | Requirement  | Description                                                                                               | Default             |
| ----------------- | ------- | ------------ | --------------------------------------------------------------------------------------------------------- | ------------------- |
| key               | string  | **Required** | The name you want to use for this partial in Eta JS                                                       |                     |
| priority          | number  | **Optional** | Used in sorting the order that templates are added to the system for nesting. Lowest number comes first.  | `0`                 |
| url               | string  | **Optional** | A url that will have a GET request made to it, and have its response body used as `template`.             | ``                  |
| template          | string  | **Required** | The content that will be used as the Eta JS. If `url` is given, it will be downloaded and replace this.   | ``                  |

## _Instructions_ (if you can call them that)

1. Install Linked Lovelace 2.0
2. Navigate to a user-created dashboard. (pretty much anything but Overview I think)
3. Put the content from [sample-dashboard.yml](https://github.com/daredoes/linked-lovelace-ui/blob/master/sample-dashboard.yml) into your dashboard using the raw configuration editor. The result should look like ![V2 Before Dashboard](/docs/imgs/v2before.png)
4. Click "Update All" and it should now look like ![V2 After Dashboard](/docs/imgs/v2after.png)
Before -> After
![Linked Lovelace V2 Demo](/docs/imgs/llv2.gif)
5. Reverse engineer it for your own needs, or file an issue, or [join the discord](https://discord.gg/WbsNtASKau) to chat with me directly about it.

## V1 to V2 conversion (or useful information)

* You no longer need "Template Dashboards". Make any top-level card in a view on any user-created dashboard a template by adding `ll_key: template_name` to the config. 

  * If you need to choose the order these templates are processed for nested templates you can use `ll_priority: 0`. 
  * The templates are sorted by lowest number first, so if you want to use `templateA` in `templateB`, `templateB` should have `ll_priority: 1` to be rendered after `templateA` has been added to our collection of available templates.
* `template_data` or `ll_data` must now be set to `ll_context`
* `template` must now be set to `ll_template`
* `ll_keys` mostly works still. two tests involving overriding context failed if someone wants to fix them. I'm considering removing this feature entirely.
* To convert an old template data variable, `$example$`, just swap the first `$` to `<%=` and the second `$` to `%>`, and retrieve the variable from `context`.
  * example: `<%= context.example %>`

* ### file an issue if I forgot something plz UwU

---

[commits-shield]: https://img.shields.io/github/commit-activity/y/daredoes/linked-lovelace-ui.svg
[commits]: https://github.com/daredoes/linked-lovelace-ui/commits/master
[license-shield]: https://img.shields.io/github/license/daredoes/linked-lovelace-ui.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2023
[releases-shield]: https://img.shields.io/github/release/daredoes/linked-lovelace-ui.svg
[releases]: https://github.com/daredoes/linked-lovelace-ui/releases
