---
outline: deep
---

# Live Demo

This playground runs the actual Linked Lovelace template engine, the same code that ships to Home Assistant, right here in your browser. The window below simulates a Home Assistant dashboard. Click **Edit YAML** in its header to open the raw YAML config behind it, just like HA's *Raw configuration editor*, then **Done** to get back to the dashboard.

You don't need Home Assistant and there is nothing to install. Everything stays in your browser tab.

## Try it

1. On the **Demo** view, find the **Linked Lovelace Status** card and click **Load Data**. This first pass reads the dashboard's YAML config: the templates, the partials, and the `ll_context` shown on each dashed placeholder card all come from that YAML. Click **Edit YAML** if you want to see the source before you sync.
2. Click **Update All**. The dashed template placeholders become fully rendered cards, each filled in with its `ll_context` from the YAML, and the config updates to exactly what a real sync would write back to Home Assistant (open **Edit YAML** to inspect it).
3. Open **Edit YAML** and find the `room` template (it lives on the **Templates** view). Change its `content`, add an emoji, anything, then click **Done**.
4. Click **Update All** again. Every room card updates at once. That single edit rippling out to every card is what Linked Lovelace is for.

<ClientOnly>
  <HaPlayground />
</ClientOnly>

## What's real and what's simulated

| Piece | Real or simulated? |
|-------|--------------------|
| Template rendering (`ll_key`, `ll_template`, `ll_context`, priorities) | Real. Imported from the library source. |
| Eta partials (`include(...)`) | Real. Same Eta engine and options as in HA. |
| The YAML written back after a sync | Real. Identical pipeline to a dashboard update. |
| The dashboard window, cards, and status card UI | Simulated. A lightweight look-alike so you can see results. |
| Dashboards / websockets / saving to storage | Not used. Everything stays in your browser tab. |

The default content is the same showcase the [Starter Dashboard](./starter-dashboard) card creates in a real Home Assistant, so what you learn here transfers one-to-one.

## Things to experiment with

- In **Edit YAML**, change `state: 'on'` to `state: 'off'` in a room card's `ll_context` and re-sync. The `stateToIcon` partial picks a different icon.
- Add a fourth room by copying one of the `custom:linked-lovelace-template` cards in the `Demo` view's YAML and giving its `ll_context` a new `name`.
- Break it on purpose: misspell an `ll_template` value and sync. The card passes through unrendered, which is exactly what happens in HA (see [Troubleshooting](./troubleshooting#template-not-found)).
- Edit the `stateToIcon` partial on the Templates view to return different emoji, then re-sync.

## Ready for the real thing?

- [Getting Started](./getting-started) covers installing the card in Home Assistant.
- [Starter Dashboard](./starter-dashboard) drops this exact demo into your HA.
- [Creating Your First Template](./create-your-first-template) walks through building your own.
