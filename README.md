# Linked Lovelace UI v3

A pure JS client-side implementation of re-usable cards between Home Assistant Dashboards.

## Features

* Create cards in the Lovelace UI that can be **linked** to multiple dashboards
* Provide templating when creating linked cards using [Eta.js](https://eta.js.org/)
  * Create dynamic partials from local templates, or online templates!
  * Access Template Data with variable `context` e.g. `<%= context.name %>`

## Installation

Add through [HACS](https://github.com/custom-components/hacs).

## Migration from v2

Version 3 is a complete rewrite of the library, and as such, there are a few breaking changes to be aware of.

*   **Centralized Management:** Templates and partials are now discovered automatically. You no longer need to define them in a specific dashboard.
*   **New UI:** The UI has been completely redesigned to be more user-friendly and intuitive.
*   **Configuration:** The configuration options have been simplified. The `ll_key`, `ll_template`, and `ll_context` options are still supported, but the `ll_priority` and `ll_keys` options have been removed.

To migrate from v2, you will need to:

1.  Update the card in HACS.
2.  Remove any `ll_priority` and `ll_keys` options from your card configurations.
3.  Verify that your templates and partials are being discovered correctly.

## Options

| Name | Type | Requirement | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `type` | string | **Required** | `custom:linked-lovelace-template` | |
| `ll_template` | string | **Required** | The key of the template to use. | |
| `ll_context` | object | **Optional** | An object that can be accessed inside of Eta.js as `context`. | `{}` |

| Name | Type | Requirement | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `type` | string | **Required** | Any Lovelace card type. | |
| `ll_key` | string | **Required** | The key you want to use for this template. | |

| Name | Type | Requirement | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `type` | string | **Required** | `custom:linked-lovelace-partials` | |
| `partials` | list | **Required** | A list of partials you want to use in Eta.js. | `[]` |

A `partial` object has the following shape:

| Name | Type | Requirement | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `key` | string | **Required** | The name you want to use for this partial in Eta.js. | |
| `template` | string | **Required** | The content that will be used as the Eta.js template. | |
